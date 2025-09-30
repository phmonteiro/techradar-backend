import sql from 'mssql';
import { getDb } from '../config/database.js';

async function getUserLikeStatusByTrendGeneratedID(userId, generatedId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check like status in TrendLikes table
    const pool = await getDb();
    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .input('TrendGeneratedID', sql.NVarChar, generatedId)
      .query(`
        SELECT TOP 1 1 as liked
        FROM TrendLikes 
        WHERE UserId = @userId 
        AND TrendGeneratedID = @trendGeneratedID
      `);
    
    return result;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getAllTrends() {
  try {
    const pool = await getDb();
    const result = await pool.request().query('SELECT * FROM Trend');

    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTrendByGeneratedID(generatedId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query('SELECT * FROM Trend WHERE GeneratedID = @generatedId');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTrendsPaginated(page = 1, limit = 10, search = '') {
  try {
    const pool = await getDb();
    const offset = (page - 1) * limit;
    let result;
    
    if (search) {
      result = await pool.request()
        .input('search', sql.NVarChar, `%${search}%`)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT * FROM Trend 
          WHERE Name LIKE @search OR GeneratedID LIKE @search
          ORDER BY Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Trend 
          WHERE Name LIKE @search OR GeneratedID LIKE @search;
        `);
    } else {
      result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT * FROM Trend 
          ORDER BY Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Trend;
        `);
    }
    
    return {
      trends: result.recordsets[0],
      total: result.recordsets[1][0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.recordsets[1][0].total / limit)
    };
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getLikesByTrendGeneratedID(generatedId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query(`
        SELECT COUNT(*) as likesCount
        FROM TrendLikes 
        WHERE TrendGeneratedID = @generatedId
      `);
    
    return result.recordset[0].likesCount;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function likeTrendByGeneratedID(userId, generatedId) {
  try {    
    const id = parseInt(userId);
    const pool = await getDb();

    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('userId', sql.Int, id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM TrendLikes WHERE TrendGeneratedID = @generatedId AND UserId = @userId)
          INSERT INTO TrendLikes (TrendGeneratedID, UserId) VALUES (@generatedId, @userId)
        ELSE
          DELETE FROM TrendLikes WHERE TrendGeneratedID = @generatedId AND UserId = @userId
      `);
    
    // Check if the like was added or removed
    const likeStatus = result.rowsAffected[0] > 0 ? 'liked' : 'unliked';
    return {
      status: likeStatus,
      message: `Trend ${likeStatus} successfully`
    };
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTrendsCount() {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .query('SELECT COUNT(*) as count FROM Trend');
    return result.recordset[0].count;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTrendDropdownList() {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .query('SELECT Id, Name, GeneratedID FROM Trend ORDER BY Name');
    
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTrendById(id) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Trend WHERE Id = @id');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function createTrend(trendData) {
  try {
    const pool = await getDb();
    
    // Check if GeneratedID already exists
    const checkResult = await pool.request()
      .input('generatedId', sql.NVarChar, trendData.GeneratedID)
      .query('SELECT Id FROM Trend WHERE GeneratedID = @generatedId');
      
    if (checkResult.recordset.length > 0) {
      const error = new Error('Trend with this GeneratedID already exists');
      error.statusCode = 400;
      throw error;
    }

    console.log("Creating trend:", trendData);
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, trendData.GeneratedID)
      .input('name', sql.NVarChar, trendData.Name)
      .input('abstract', sql.NVarChar, trendData.Abstract)
      .input('stage', sql.NVarChar, trendData.Stage)
      .input('definitionAndScope', sql.NVarChar, trendData.DefinitionAndScope)
      .input('relevanceAndImpact', sql.NVarChar, trendData.RelevanceAndImpact)
      .input('trendSegment', sql.NVarChar, trendData.TrendSegment)
      .input('trendMaturity', sql.NVarChar, trendData.TrendMaturity)
      .input('recommendedAction', sql.NVarChar, trendData.RecommendedAction)
      .input('contentSource', sql.NVarChar, trendData.ContentSource)
      .input('lastChangeDate', sql.DateTime, trendData.LastReviewDate)
      .input('imageUrl', sql.NVarChar, trendData.ImageUrl)
      .input('ring', sql.Int, trendData.Ring)
      .input('quadrant', sql.Int, trendData.Quadrant)
      .input('link', sql.NVarChar, process.env.APP_URL+'trends/'+trendData.GeneratedID)
      .query(`
        INSERT INTO Trend (
          GeneratedID, Name, Abstract, Stage, DefinitionAndScope,
          RelevanceAndImpact, TrendSegment, TrendMaturityLevel,
          RecommendedAction, ContentSource, LastChangeDate, ImageUrl, Ring, Quadrant, Link
          )
          OUTPUT INSERTED.*
          VALUES (
          @generatedId, @name, @abstract, @stage, @definitionAndScope,
          @relevanceAndImpact, @trendSegment, @trendMaturity,
          @recommendedAction, @contentSource, @lastChangeDate, @imageUrl, @ring, @quadrant, @link
          )
      `);

      console.log("Trend created successfully:", result.recordset[0]);
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function updateTrend(generatedId, trendData) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('name', sql.NVarChar, trendData.Name)
      .input('abstract', sql.NVarChar, trendData.Abstract)
      .input('stage', sql.NVarChar, trendData.Stage)
      .input('definitionAndScope', sql.NVarChar, trendData.DefinitionAndScope)
      .input('relevanceAndImpact', sql.NVarChar, trendData.RelevanceAndImpact)
      .input('trendSegment', sql.NVarChar, trendData.TrendSegment)
      .input('trendMaturity', sql.NVarChar, trendData.TrendMaturity)
      .input('recommendedAction', sql.NVarChar, trendData.RecommendedAction)
      .input('contentSource', sql.NVarChar, trendData.ContentSource)
      .input('lastChangeDate', sql.DateTime, trendData.LastChangeDate)
      .input('imageUrl', sql.NVarChar, trendData.ImageUrl)
      .input('ring', sql.Int, trendData.Ring)
      .input('quadrant', sql.Int, trendData.Quadrant)
      .input('link', sql.NVarChar, process.env.APP_URL+'trend/'+generatedId)
      .query(`
        UPDATE Trend
        SET Name = @name,
            Abstract = @abstract,
            Stage = @stage,
            DefinitionAndScope = @definitionAndScope,
            RelevanceAndImpact = @relevanceAndImpact,
            TrendSegment = @trendSegment,
            TrendMaturityLevel = @trendMaturity,
            RecommendedAction = @recommendedAction,
            ContentSource = @contentSource,
            LastChangeDate = @lastChangeDate,
            ImageUrl = @imageUrl,
            Ring = @ring,
            Quadrant = @quadrant,
            Link = @link
        WHERE GeneratedID = @generatedId;
        
        SELECT * FROM Trend WHERE GeneratedID = @generatedId;
      `);
    
    return result;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function deleteTrend(generatedId) {
  try {
    const pool = await getDb();
    
    // First delete all likes for this trend
    await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query('DELETE FROM TrendLikes WHERE TrendGeneratedID = @generatedId');
    
    // Then delete the trend
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query('DELETE FROM Trend WHERE GeneratedID = @generatedId');
    
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function updateTrendStage(generatedId, stage) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('stage', sql.NVarChar, stage)
      .query(`
        UPDATE Trend
        SET Stage = @stage
        WHERE GeneratedID = @generatedId;
        
        SELECT * FROM Trend WHERE GeneratedID = @generatedId;
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTrendsByQuadrant(quadrantId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('quadrantId', sql.Int, quadrantId)
      .query('SELECT * FROM Trend WHERE Quadrant = @quadrantId');
    
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTrendsByRing(ringId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('ringId', sql.Int, ringId)
      .query('SELECT * FROM Trend WHERE Ring = @ringId');
    
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

export {
  getAllTrends,
  getTrendByGeneratedID,
  getTrendsPaginated,
  getTrendsCount,
  getTrendDropdownList,
  getTrendById,
  createTrend,
  updateTrend,
  deleteTrend,
  likeTrendByGeneratedID,
  getUserLikeStatusByTrendGeneratedID,
  getLikesByTrendGeneratedID,
  updateTrendStage,
  getTrendsByQuadrant,
  getTrendsByRing
};
