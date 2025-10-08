import sql from 'mssql';
import { getDb } from '../config/database.js';

/**
 * Get average ratings for a specific item (technology or trend) - for display
 */
export const getAverageRatingsForItem = async (req, res) => {
  try {
    const { itemType, generatedId } = req.params;
    
    if (!['technology', 'trend'].includes(itemType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "technology" or "trend"'
      });
    }

    const pool = await getDb();
    const itemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();
    
    const result = await pool.request()
      .input('itemType', sql.NVarChar, itemTypeCapitalized)
      .input('generatedId', sql.NVarChar, generatedId)
      .query(`
        SELECT 
          rt.RatingKey,
          rt.DisplayName,
          rt.Category,
          rt.MaxValue,
          rt.ScaleLabels,
          rt.Icon,
          rt.SortOrder,
          ISNULL(ar.AverageRating, 0) as RatingValue,
          ISNULL(ar.RatingCount, 0) as RatingCount,
          CASE 
            WHEN ar.AverageRating IS NULL THEN 'Not Rated'
            WHEN ar.AverageRating = 0 THEN JSON_VALUE(rt.ScaleLabels, '$[0]')
            ELSE JSON_VALUE(rt.ScaleLabels, '$[' + CAST(ROUND(ar.AverageRating, 0) AS varchar) + ']')
          END as RatingLabel,
          ar.LastUpdated as LastRatedAt
        FROM [dbo].[RatingTypes] rt
        LEFT JOIN [dbo].[v_AverageRatings] ar ON rt.RatingKey = ar.RatingKey 
          AND rt.ItemType = ar.ItemType 
          AND ar.GeneratedID = @generatedId
        WHERE rt.ItemType = @itemType AND rt.IsActive = 1
        ORDER BY rt.SortOrder
      `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Error fetching average ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get user-specific ratings for a specific item (technology or trend) - for modal editing
 */
export const getUserRatingsForItem = async (req, res) => {
  try {
    const { itemType, generatedId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!['technology', 'trend'].includes(itemType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "technology" or "trend"'
      });
    }

    const pool = await getDb();
    const itemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();
    
    const result = await pool.request()
      .input('itemType', sql.NVarChar, itemTypeCapitalized)
      .input('generatedId', sql.NVarChar, generatedId)
      .input('userId', sql.NVarChar, userId)
      .query(`
        SELECT 
          rt.RatingKey,
          rt.DisplayName,
          rt.Category,
          rt.MaxValue,
          rt.ScaleLabels,
          rt.Icon,
          rt.SortOrder,
          ISNULL(r.RatingValue, 0) as RatingValue,
          CASE 
            WHEN r.RatingLabel IS NULL THEN JSON_VALUE(rt.ScaleLabels, '$[0]')
            ELSE r.RatingLabel 
          END as RatingLabel,
          r.UpdatedAt as LastRatedAt
        FROM [dbo].[RatingTypes] rt
        LEFT JOIN [dbo].[Ratings] r ON rt.RatingKey = r.RatingKey 
          AND r.ItemType = @itemType 
          AND r.GeneratedID = @generatedId
          AND r.UserID = @userId
          AND r.IsActive = 1
        WHERE rt.ItemType = @itemType AND rt.IsActive = 1
        ORDER BY rt.SortOrder
      `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Legacy method - kept for backward compatibility, now returns average ratings
 */
export const getRatingsForItem = async (req, res) => {
  return getAverageRatingsForItem(req, res);
};

/**
 * Update/Create ratings for a specific item
 */
export const updateItemRatings = async (req, res) => {
  try {
    const { itemType, generatedId } = req.params;
    const { ratings } = req.body; // Array of rating objects
    const userId = req.user?.userId;

    if (!['technology', 'trend'].includes(itemType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "technology" or "trend"'
      });
    }

    if (!ratings || !Array.isArray(ratings)) {
      return res.status(400).json({
        success: false,
        message: 'Ratings array is required'
      });
    }

    const pool = await getDb();
    const itemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();
    
    // Get the actual item ID from the database
    const itemTableName = itemTypeCapitalized === 'Technology' ? 'Technology' : 'Trend';
    const itemResult = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query(`SELECT ID FROM [dbo].[${itemTableName}] WHERE GeneratedID = @generatedId`);

    if (itemResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `${itemTypeCapitalized} not found`
      });
    }

    const itemId = itemResult.recordset[0].ID;

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Process each rating
      for (const rating of ratings) {
        const { ratingKey, ratingValue, ratingLabel, maxValue } = rating;

        if (!ratingKey || ratingValue === undefined) {
          throw new Error(`Invalid rating data: missing ratingKey or ratingValue`);
        }

        // Validate rating value
        if (ratingValue < 0 || ratingValue > maxValue) {
          throw new Error(`Rating value ${ratingValue} is out of range (0-${maxValue}) for ${ratingKey}`);
        }

        // Upsert the rating with UserID
        await transaction.request()
          .input('itemType', sql.NVarChar, itemTypeCapitalized)
          .input('itemId', sql.Int, itemId)
          .input('generatedId', sql.NVarChar, generatedId)
          .input('ratingKey', sql.NVarChar, ratingKey)
          .input('ratingValue', sql.Int, ratingValue)
          .input('ratingLabel', sql.NVarChar, ratingLabel || 'Not Rated')
          .input('maxValue', sql.Int, maxValue)
          .input('userId', sql.NVarChar, userId)
          .input('now', sql.DateTime2, new Date())
          .query(`
            MERGE [dbo].[Ratings] AS target
            USING (SELECT 
              @itemType as ItemType,
              @generatedId as GeneratedID,
              @ratingKey as RatingKey,
              @userId as UserID
            ) AS source ON target.ItemType = source.ItemType 
              AND target.GeneratedID = source.GeneratedID 
              AND target.RatingKey = source.RatingKey
              AND target.UserID = source.UserID
            WHEN MATCHED THEN
              UPDATE SET 
                RatingValue = @ratingValue,
                RatingLabel = @ratingLabel,
                MaxValue = @maxValue,
                UpdatedBy = @userId,
                UpdatedAt = @now,
                IsActive = 1
            WHEN NOT MATCHED THEN
              INSERT (ItemType, ItemID, GeneratedID, RatingKey, RatingValue, RatingLabel, MaxValue, UserID, CreatedBy, CreatedAt, UpdatedBy, UpdatedAt, IsActive)
              VALUES (@itemType, @itemId, @generatedId, @ratingKey, @ratingValue, @ratingLabel, @maxValue, @userId, @userId, @now, @userId, @now, 1);
          `);
      }

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Ratings updated successfully'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Delete a specific rating
 */
export const deleteItemRating = async (req, res) => {
  try {
    const { itemType, generatedId, ratingKey } = req.params;
    const userId = req.user?.userId;

    if (!['technology', 'trend'].includes(itemType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "technology" or "trend"'
      });
    }

    const pool = await getDb();
    const itemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();

    const result = await pool.request()
      .input('itemType', sql.NVarChar, itemTypeCapitalized)
      .input('generatedId', sql.NVarChar, generatedId)
      .input('ratingKey', sql.NVarChar, ratingKey)
      .input('userId', sql.NVarChar, userId)
      .input('now', sql.DateTime2, new Date())
      .query(`
        UPDATE [dbo].[Ratings] 
        SET IsActive = 0, UpdatedBy = @userId, UpdatedAt = @now
        WHERE ItemType = @itemType 
          AND GeneratedID = @generatedId 
          AND RatingKey = @ratingKey
          AND IsActive = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get all rating types for a specific item type (for configuration/setup)
 */
export const getRatingTypes = async (req, res) => {
  try {
    const { itemType } = req.params;

    if (!['technology', 'trend'].includes(itemType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "technology" or "trend"'
      });
    }

    const pool = await getDb();
    const itemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();

    const result = await pool.request()
      .input('itemType', sql.NVarChar, itemTypeCapitalized)
      .query(`
        SELECT 
          RatingKey,
          DisplayName,
          Category,
          MaxValue,
          ScaleLabels,
          Icon,
          SortOrder
        FROM [dbo].[RatingTypes]
        WHERE ItemType = @itemType AND IsActive = 1
        ORDER BY SortOrder
      `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Error fetching rating types:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};