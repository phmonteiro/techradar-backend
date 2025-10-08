-- Migration script to create separate ratings table
-- This will replace the rating columns in Technology and Trend tables

-- Create the Ratings table
CREATE TABLE [dbo].[Ratings](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [ItemType] [nvarchar](20) NOT NULL, -- 'Technology' or 'Trend'
    [ItemID] [int] NOT NULL, -- Foreign key to Technology or Trend table ID
    [GeneratedID] [nvarchar](100) NOT NULL, -- The GeneratedID of the technology/trend
    [RatingKey] [nvarchar](50) NOT NULL, -- e.g., 'potential-benefit', 'business-impact'
    [RatingValue] [int] NOT NULL, -- The numeric rating value (0-5)
    [RatingLabel] [nvarchar](100) NULL, -- The text label for the rating
    [MaxValue] [int] NOT NULL, -- Maximum possible value for this rating type
    [CreatedBy] [nvarchar](100) NULL, -- UserID who created the rating
    [CreatedAt] [datetime2] NOT NULL DEFAULT GETDATE(),
    [UpdatedBy] [nvarchar](100) NULL, -- UserID who last updated the rating
    [UpdatedAt] [datetime2] NOT NULL DEFAULT GETDATE(),
    [IsActive] [bit] NOT NULL DEFAULT 1,
    
    -- Primary key
    CONSTRAINT [PK_Ratings] PRIMARY KEY CLUSTERED ([Id] ASC),
    
    -- Unique constraint to prevent duplicate ratings for the same item/rating combination
    CONSTRAINT [UC_Ratings_ItemRating] UNIQUE ([ItemType], [GeneratedID], [RatingKey]),
    
    -- Check constraints
    CONSTRAINT [CK_Ratings_ItemType] CHECK ([ItemType] IN ('Technology', 'Trend')),
    CONSTRAINT [CK_Ratings_RatingValue] CHECK ([RatingValue] >= 0 AND [RatingValue] <= [MaxValue])
);

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX [IX_Ratings_ItemType_GeneratedID] 
ON [dbo].[Ratings] ([ItemType], [GeneratedID]);

CREATE NONCLUSTERED INDEX [IX_Ratings_CreatedBy] 
ON [dbo].[Ratings] ([CreatedBy]);

CREATE NONCLUSTERED INDEX [IX_Ratings_UpdatedAt] 
ON [dbo].[Ratings] ([UpdatedAt]);

-- Rating configuration reference table for validation and metadata
CREATE TABLE [dbo].[RatingTypes](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [ItemType] [nvarchar](20) NOT NULL, -- 'Technology' or 'Trend'
    [RatingKey] [nvarchar](50) NOT NULL, -- e.g., 'potential-benefit'
    [DisplayName] [nvarchar](100) NOT NULL, -- e.g., 'Potential Benefit'
    [Category] [nvarchar](50) NOT NULL, -- e.g., 'benefit', 'impact', 'scope'
    [MaxValue] [int] NOT NULL,
    [ScaleLabels] [nvarchar](500) NOT NULL, -- JSON array of scale labels
    [Icon] [nvarchar](10) NULL, -- Unicode icon
    [SortOrder] [int] NOT NULL DEFAULT 0,
    [IsActive] [bit] NOT NULL DEFAULT 1,
    
    CONSTRAINT [PK_RatingTypes] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UC_RatingTypes_ItemTypeKey] UNIQUE ([ItemType], [RatingKey])
);

-- Insert Technology rating types
INSERT INTO [dbo].[RatingTypes] ([ItemType], [RatingKey], [DisplayName], [Category], [MaxValue], [ScaleLabels], [Icon], [SortOrder]) VALUES
('Technology', 'potential-benefit', 'Potential Benefit', 'benefit', 3, '["Low", "Moderate", "High", "Transformational"]', '💡', 1),
('Technology', 'application-scope', 'Application Scope', 'scope', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '📏', 2),
('Technology', 'business-model-fit', 'Business Model Fit', 'impact', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '🎯', 3),
('Technology', 'business-impact', 'Business Impact', 'impact', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '💼', 4),
('Technology', 'disruptive-potential', 'Disruptive Potential', 'impact', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '💥', 5),
('Technology', 'internal-know-how', 'Internal Know-How', 'scope', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '🧠', 6),
('Technology', 'time-to-maturity', 'Time to Maturity', 'time', 4, '["<2 years", "2-5 years", "5-10 years", ">10 years"]', '⏰', 7);

-- Insert Trend rating types
INSERT INTO [dbo].[RatingTypes] ([ItemType], [RatingKey], [DisplayName], [Category], [MaxValue], [ScaleLabels], [Icon], [SortOrder]) VALUES
('Trend', 'business-relevance-fidelidade', 'Business Relevance for Fidelidade', 'relevance', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '🏢', 1),
('Trend', 'disruptive-potential', 'Disruptive Potential', 'impact', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '💥', 2),
('Trend', 'internal-know-how', 'Internal Know-How', 'scope', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '🧠', 3),
('Trend', 'market-potential', 'Market Potential', 'impact', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '📈', 4),
('Trend', 'need-for-action', 'Need for Action', 'urgency', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '⚡', 5),
('Trend', 'strategic-fit', 'Strategic Fit', 'strategy', 5, '["None", "Very Low", "Low", "Medium", "High", "Very High"]', '🎯', 6),
('Trend', 'time-to-market-impact', 'Time to Market Impact', 'time', 5, '["0–2 years", "3–5 years", "6–10 years", "11–15 years", "15+ years"]', '⏰', 7);

GO

-- Optional: Create views for easier querying
CREATE VIEW [dbo].[V_TechnologyRatings] AS
SELECT 
    t.ID as TechnologyID,
    t.GeneratedID,
    t.Label,
    rt.RatingKey,
    rt.DisplayName,
    rt.Category,
    rt.MaxValue,
    rt.ScaleLabels,
    rt.Icon,
    ISNULL(r.RatingValue, 0) as RatingValue,
    ISNULL(r.RatingLabel, 'Not Rated') as RatingLabel,
    r.UpdatedAt as LastRatedAt,
    r.UpdatedBy as LastRatedBy
FROM [dbo].[Technology] t
CROSS JOIN [dbo].[RatingTypes] rt
LEFT JOIN [dbo].[Ratings] r ON t.GeneratedID = r.GeneratedID 
    AND rt.ItemType = 'Technology' 
    AND rt.RatingKey = r.RatingKey
WHERE rt.ItemType = 'Technology' AND rt.IsActive = 1;

GO

CREATE VIEW [dbo].[V_TrendRatings] AS
SELECT 
    t.ID as TrendID,
    t.GeneratedID,
    t.Label,
    rt.RatingKey,
    rt.DisplayName,
    rt.Category,
    rt.MaxValue,
    rt.ScaleLabels,
    rt.Icon,
    ISNULL(r.RatingValue, 0) as RatingValue,
    ISNULL(r.RatingLabel, 'Not Rated') as RatingLabel,
    r.UpdatedAt as LastRatedAt,
    r.UpdatedBy as LastRatedBy
FROM [dbo].[Trend] t
CROSS JOIN [dbo].[RatingTypes] rt
LEFT JOIN [dbo].[Ratings] r ON t.GeneratedID = r.GeneratedID 
    AND rt.ItemType = 'Trend' 
    AND rt.RatingKey = r.RatingKey
WHERE rt.ItemType = 'Trend' AND rt.IsActive = 1;