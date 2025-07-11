import sql from 'mssql';
import { getDb } from '../config/database.js';

async function getUserLikeStatusByTechnologyLabel(userId, label) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check like status in TechnologyLikes table
    const pool = await getDb();
    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .input('TechnologyLabel', sql.NVarChar, label)
      .query(`
        SELECT TOP 1 1 as liked
        FROM TechnologyLikes 
        WHERE UserId = @userId 
        AND TechnologyLabel = @technologyLabel
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

async function getTechnologyByLabel(label) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query('SELECT * FROM Technology WHERE Label = @label');
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
          WHERE Name LIKE @search OR Label LIKE @search
          ORDER BY Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Technology 
          WHERE Name LIKE @search OR Label LIKE @search;
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

async function getLikesByTechnologyLabel(label) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query(`
        SELECT COUNT(*) as likesCount
        FROM TechnologyLikes 
        WHERE TechnologyLabel = @label
      `);
    
    return result.recordset[0].likesCount;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function likeTechnologyByLabel(userId, label) {
  try {    
    const id = parseInt(userId);
    const pool = await getDb();

    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .input('userId', sql.Int, id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM TechnologyLikes WHERE TechnologyLabel = @label AND UserId = @userId)
          INSERT INTO TechnologyLikes (TechnologyLabel, UserId) VALUES (@label, @userId)
        ELSE
          DELETE FROM TechnologyLikes WHERE TechnologyLabel = @label AND UserId = @userId
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
      .query('SELECT Id, Name, Label FROM Technology ORDER BY Name');
    
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
    
    // Check if Label already exists
    const checkResult = await pool.request()
      .input('label', sql.NVarChar, technologyData.Label)
      .query('SELECT Id FROM Technology WHERE Label = @label');
      
    if (checkResult.recordset.length > 0) {
      const error = new Error('Technology with this Label already exists');
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.request()
      .input('label', sql.NVarChar, technologyData.Label)
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
      .input('link', sql.NVarChar, process.env.APP_URL+'technology/'+technologyData.Label)
      .query(`
        INSERT INTO Technology (
          Label, Name, Abstract, Stage, DefinitionAndScope,
          RelevanceAndImpact, TechnologySegment, TechnologyMaturity,
          RecommendedAction, ContentSource, LastReviewDate, ImageUrl, Ring, Quadrant, Link
          )
          OUTPUT INSERTED.*
          VALUES (
          @label, @name, @abstract, @stage, @definitionAndScope,
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

async function updateTechnology(label, technologyData) {
  try {
    const pool = await getDb();

    
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
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
        WHERE Label = @label
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function deleteTechnology(label) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query('DELETE FROM Technology OUTPUT DELETED.* WHERE Label = @label');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function updateTechnologyStage(label, stage) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .input('stage', sql.NVarChar, stage)
      .query(`
        UPDATE Technology SET
          Stage = @stage,
          LastReviewDate = GETDATE()
        OUTPUT INSERTED.*
        WHERE Label = @label
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

export {
  getAllTechnologies,
  getTechnologyByLabel,
  getTechnologiesPaginated,
  getTechnologiesCount,
  getTechnologyDropdownList,
  getTechnologyById,
  createTechnology,
  updateTechnology,
  deleteTechnology,
  getUserLikeStatusByTechnologyLabel,
  likeTechnologyByLabel,
  getLikesByTechnologyLabel,
  updateTechnologyStage
};
