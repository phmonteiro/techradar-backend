-- Migration: Add UserID column to Ratings table for individual user ratings
-- This enables each user to have their own ratings for technologies and trends

-- Step 1: Add UserID column to the Ratings table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Ratings]') AND name = 'UserID')
BEGIN
    ALTER TABLE [dbo].[Ratings] 
    ADD [UserID] [nvarchar](100) NULL;
END
GO

-- Step 2: Update existing ratings with a default UserID (if any exist)
-- This is for backward compatibility with existing data
UPDATE [dbo].[Ratings] 
SET [UserID] = [CreatedBy] 
WHERE [UserID] IS NULL AND [CreatedBy] IS NOT NULL;
GO

-- Step 3: Make UserID NOT NULL after populating existing records
ALTER TABLE [dbo].[Ratings] 
ALTER COLUMN [UserID] [nvarchar](100) NOT NULL;
GO

-- Step 4: Drop the old unique constraint
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UC_Ratings_ItemRating')
BEGIN
    ALTER TABLE [dbo].[Ratings] DROP CONSTRAINT [UC_Ratings_ItemRating];
END
GO

-- Step 5: Create new unique constraint that includes UserID
-- This ensures each user can only have one rating per item/ratingKey combination
ALTER TABLE [dbo].[Ratings] ADD CONSTRAINT [UC_Ratings_UserItemRating] 
UNIQUE NONCLUSTERED ([UserID], [ItemType], [GeneratedID], [RatingKey]);
GO

-- Step 6: Create index on UserID for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Ratings_UserID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Ratings_UserID] ON [dbo].[Ratings]
    ([UserID] ASC)
    WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF);
END
GO

-- Step 7: Create view for average ratings across all users
IF OBJECT_ID('[dbo].[v_AverageRatings]', 'V') IS NOT NULL
    DROP VIEW [dbo].[v_AverageRatings];
GO

CREATE VIEW [dbo].[v_AverageRatings] AS
SELECT 
    r.ItemType,
    r.GeneratedID,
    r.RatingKey,
    rt.DisplayName,
    rt.Category,
    rt.MaxValue,
    rt.ScaleLabels,
    rt.Icon,
    rt.SortOrder,
    AVG(CAST(r.RatingValue AS FLOAT)) as AverageRating,
    COUNT(DISTINCT r.UserID) as RatingCount,
    MAX(r.UpdatedAt) as LastUpdated
FROM [dbo].[Ratings] r
INNER JOIN [dbo].[RatingTypes] rt ON r.RatingKey = rt.RatingKey AND r.ItemType = rt.ItemType
WHERE r.IsActive = 1 AND rt.IsActive = 1
GROUP BY 
    r.ItemType, 
    r.GeneratedID, 
    r.RatingKey,
    rt.DisplayName,
    rt.Category,
    rt.MaxValue,
    rt.ScaleLabels,
    rt.Icon,
    rt.SortOrder;
GO

-- Step 8: Create view for user-specific ratings
IF OBJECT_ID('[dbo].[v_UserRatings]', 'V') IS NOT NULL
    DROP VIEW [dbo].[v_UserRatings];
GO

CREATE VIEW [dbo].[v_UserRatings] AS
SELECT 
    rt.ItemType,
    rt.RatingKey,
    rt.DisplayName,
    rt.Category,
    rt.MaxValue,
    rt.ScaleLabels,
    rt.Icon,
    rt.SortOrder,
    r.GeneratedID,
    r.UserID,
    ISNULL(r.RatingValue, 0) as RatingValue,
    ISNULL(r.RatingLabel, 'Not Rated') as RatingLabel,
    r.UpdatedAt as LastRatedAt
FROM [dbo].[RatingTypes] rt
LEFT JOIN [dbo].[Ratings] r ON rt.RatingKey = r.RatingKey 
    AND rt.ItemType = r.ItemType
    AND r.IsActive = 1
WHERE rt.IsActive = 1;
GO

PRINT 'User ratings migration completed successfully!';
PRINT 'New features:';
PRINT '- Each user can now have individual ratings for technologies and trends';
PRINT '- Use v_AverageRatings view to get average ratings across all users';
PRINT '- Use v_UserRatings view to get user-specific ratings with defaults';