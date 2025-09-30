import sql from 'mssql';
import { getDb } from '../config/database.js';

async function getUserLikeStatusByTechnologyGeneratedID(userId, generatedId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check like status in TechnologyLikes table
    const pool = await getDb();
    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .input('TechnologyGeneratedID', sql.NVarChar, generatedId)
      .query(`
        SELECT TOP 1 1 as liked
        FROM TechnologyLikes 
        WHERE UserId = @userId 
        AND TechnologyGeneratedID = @technologyGeneratedID
      `);
    
    return result;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getAllTechnologies() {
  try {
    const pool = await getDb();
    const result = await pool.request().query('SELECT * FROM Technology');

    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTechnologyByGeneratedID(generatedId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query('SELECT * FROM Technology WHERE GeneratedID = @generatedId');
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTechnologiesPaginated(page = 1, limit = 10, search = '') {
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
          SELECT * FROM Technology 
          WHERE Name LIKE @search OR GeneratedID LIKE @search
          ORDER BY Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Technology 
          WHERE Name LIKE @search OR GeneratedID LIKE @search;
        `);
    } else {
      result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT * FROM Technology 
          ORDER BY Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Technology;
        `);
    }
    
    return {
      technologies: result.recordsets[0],
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

async function getLikesByTechnologyGeneratedID(generatedId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query(`
        SELECT COUNT(*) as likesCount
        FROM TechnologyLikes 
        WHERE TechnologyGeneratedID = @generatedId
      `);
    
    return result.recordset[0].likesCount;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function likeTechnologyByGeneratedID(userId, generatedId) {
  try {    
    const id = parseInt(userId);
    const pool = await getDb();

    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('userId', sql.Int, id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM TechnologyLikes WHERE TechnologyGeneratedID = @generatedId AND UserId = @userId)
          INSERT INTO TechnologyLikes (TechnologyGeneratedID, UserId) VALUES (@generatedId, @userId)
        ELSE
          DELETE FROM TechnologyLikes WHERE TechnologyGeneratedID = @generatedId AND UserId = @userId
      `);
    
    // Check if the like was added or removed
    const likeStatus = result.rowsAffected[0] > 0 ? 'liked' : 'unliked';
    return {
      status: likeStatus,
      message: `Technology ${likeStatus} successfully`
    };
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTechnologiesCount() {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .query('SELECT COUNT(*) as count FROM Technology');
    
    return result.recordset[0].count;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTechnologyDropdownList() {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .query('SELECT Id, Name, GeneratedID FROM Technology ORDER BY Name');
    
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getTechnologyById(id) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Technology WHERE Id = @id');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function createTechnology(technologyData) {
  try {
    const pool = await getDb();
    
    // Check if GeneratedID already exists
    const checkResult = await pool.request()
      .input('generatedId', sql.NVarChar, technologyData.GeneratedID)
      .query('SELECT Id FROM Technology WHERE GeneratedID = @generatedId');
      
    if (checkResult.recordset.length > 0) {
      const error = new Error('Technology with this GeneratedID already exists');
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.request()
      .input('generatedId', sql.NVarChar, technologyData.GeneratedID)
      .input('name', sql.NVarChar, technologyData.Name)
      .input('abstract', sql.NVarChar, technologyData.Abstract)
      .input('stage', sql.NVarChar, technologyData.Stage)
      .input('definitionAndScope', sql.NVarChar, technologyData.DefinitionAndScope)
      .input('relevanceAndImpact', sql.NVarChar, technologyData.RelevanceAndImpact)
      .input('technologySegment', sql.NVarChar, technologyData.TechnologySegment)
      .input('technologyMaturity', sql.NVarChar, technologyData.TechnologyMaturity)
      .input('recommendedAction', sql.NVarChar, technologyData.RecommendedAction)
      .input('contentSource', sql.NVarChar, technologyData.ContentSource)
      .input('lastReviewDate', sql.DateTime, technologyData.LastReviewDate)
      .input('imageUrl', sql.NVarChar, technologyData.ImageUrl)
      .input('ring', sql.Int, technologyData.Ring)
      .input('quadrant', sql.Int, technologyData.Quadrant)
      .input('link', sql.NVarChar, process.env.APP_URL+'technology/'+technologyData.GeneratedID)
      .query(`
        INSERT INTO Technology (
          GeneratedID, Name, Abstract, Stage, DefinitionAndScope,
          RelevanceAndImpact, TechnologySegment, TechnologyMaturity,
          RecommendedAction, ContentSource, LastReviewDate, ImageUrl, Ring, Quadrant, Link
          )
          OUTPUT INSERTED.*
          VALUES (
          @generatedId, @name, @abstract, @stage, @definitionAndScope,
          @relevanceAndImpact, @technologySegment, @technologyMaturity,
          @recommendedAction, @contentSource, @lastReviewDate, @imageUrl, @ring, @quadrant, @link
          )
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function updateTechnology(generatedId, technologyData) {
  try {
    const pool = await getDb();

    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('name', sql.NVarChar, technologyData.Name)
      .input('abstract', sql.NVarChar, technologyData.Abstract)
      .input('stage', sql.NVarChar, technologyData.Stage)
      .input('definitionAndScope', sql.NVarChar, technologyData.DefinitionAndScope)
      .input('relevanceAndImpact', sql.NVarChar, technologyData.RelevanceAndImpact)
      .input('technologySegment', sql.NVarChar, technologyData.TechnologySegment)
      .input('technologyMaturity', sql.NVarChar, technologyData.TechnologyMaturity)
      .input('recommendedAction', sql.NVarChar, technologyData.RecommendedAction)
      .input('contentSource', sql.NVarChar, technologyData.ContentSource)
      .input('lastReviewDate', sql.DateTime, technologyData.LastReviewDate)
      .input('imageUrl', sql.NVarChar, technologyData.ImageUrl)
      .query(`
        UPDATE Technology SET
          Name = @name,
          Abstract = @abstract,
          Stage = @stage,
            DefinitionAndScope = @definitionAndScope,
            RelevanceAndImpact = @relevanceAndImpact,
          TechnologySegment = @technologySegment,
          TechnologyMaturity = @technologyMaturity,
          RecommendedAction = @recommendedAction,
          ContentSource = @contentSource,
          LastReviewDate = @lastReviewDate,
          ImageUrl = @imageUrl
        OUTPUT INSERTED.*
        WHERE GeneratedID = @generatedId
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function deleteTechnology(generatedId) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query('DELETE FROM Technology OUTPUT DELETED.* WHERE GeneratedID = @generatedId');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function updateTechnologyStage(generatedId, stage) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('stage', sql.NVarChar, stage)
      .query(`
        UPDATE Technology SET
          Stage = @stage,
          LastReviewDate = GETDATE()
        OUTPUT INSERTED.*
        WHERE GeneratedID = @generatedId
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

export {
  getAllTechnologies,
  getTechnologyByGeneratedID,
  getTechnologiesPaginated,
  getTechnologiesCount,
  getTechnologyDropdownList,
  getTechnologyById,
  createTechnology,
  updateTechnology,
  deleteTechnology,
  getUserLikeStatusByTechnologyGeneratedID,
  likeTechnologyByGeneratedID,
  getLikesByTechnologyGeneratedID,
  updateTechnologyStage
};
