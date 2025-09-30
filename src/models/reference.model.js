import sql from 'mssql';
import { getDb } from '../config/database.js';

async function getAllReferences() {
  try {
    const pool = await getDb();
    const result = await pool.request().query('SELECT * FROM [dbo].[References]');
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getReferencesByTrend(generatedId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query(`SELECT * FROM [References] WHERE GeneratedID = @generatedId AND Type = 'Trend' ORDER BY GeneratedID`);
    return result.recordset || [];
  } catch (err) {
    console.error(`Database query failed in getReferencesByTrend(${generatedId}):`, err);
    throw err;
  }
}

async function getReferenceById(id) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM [References] WHERE Id = @id');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getReferencesByTechnology(generatedId) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .query(`SELECT * FROM [References] WHERE GeneratedID = @generatedId and Type = 'Technology' ORDER BY GeneratedID`);
    
    return result.recordset || [];
  } catch (err) {
    console.error(`Database query failed in getReferencesByTechnology(${generatedId}):`, err);
    throw err;
  }
}

async function getReferencesPaginated(page = 1, limit = 10, search = '', generatedId = null) {
  try {
    const pool = await getDb();
    const offset = (page - 1) * limit;
    let result;
    
    if (generatedId && search) {
      result = await pool.request()
        .input('generatedId', sql.NVarChar, generatedId)
        .input('search', sql.NVarChar, `%${search}%`)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT R.*, T.Name as TechnologyName 
          FROM [dbo].[References] R
          LEFT JOIN Technology T ON R.GeneratedID = T.GeneratedID
          WHERE R.GeneratedID = @generatedId 
          AND (R.Title LIKE @search OR R.Url LIKE @search)
          ORDER BY R.Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM [dbo].[References] 
          WHERE GeneratedID = @generatedId
          AND (Title LIKE @search OR Url LIKE @search);
        `);
    } else if (generatedId) {
      result = await pool.request()
        .input('generatedId', sql.NVarChar, generatedId)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT R.*, T.Name as TechnologyName 
          FROM [dbo].[References] R
          LEFT JOIN Technology T ON R.GeneratedID = T.GeneratedID
          WHERE R.GeneratedID = @generatedId
          ORDER BY R.Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM [dbo].[References]
          WHERE GeneratedID = @generatedId;
        `);
    } else if (search) {
      result = await pool.request()
        .input('search', sql.NVarChar, `%${search}%`)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT R.*, T.Name as TechnologyName 
          FROM [dbo].[References] R
          LEFT JOIN Technology T ON R.GeneratedID = T.GeneratedID
          WHERE R.Title LIKE @search OR R.Url LIKE @search
          ORDER BY R.Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM [dbo].[References] 
          WHERE Title LIKE @search OR Url LIKE @search;
        `);
    } else {
      result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT R.*, T.Name as TechnologyName 
          FROM [dbo].[References] R
          LEFT JOIN Technology T ON R.GeneratedID = T.GeneratedID
          ORDER BY R.Id DESC
          OFFSET @offset ROWS 
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM [dbo].[References];
        `);
    }
    
    return {
      references: result.recordsets[0],
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

async function getReferencesCount() {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .query('SELECT COUNT(*) as count FROM [dbo].[References]');
    
    return result.recordset[0].count;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function createReference(referenceData) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, referenceData.GeneratedID || referenceData.Label)
      .input('title', sql.NVarChar, referenceData.Title)
      .input('url', sql.NVarChar, referenceData.Url)
      .input('type', sql.NVarChar, referenceData.Type )
      .query(`
        INSERT INTO [References] (
            GeneratedID, Title, Url, Type)
        OUTPUT INSERTED.*
        VALUES (
          @generatedId, @title, @url, @type
        )
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function updateReference(id, referenceData) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar, referenceData.Title)
      .input('url', sql.NVarChar, referenceData.Url)
      .input('source', sql.NVarChar, referenceData.Source || null)
      .input('type', sql.NVarChar, referenceData.Type || 'Link')
      .query(`
        UPDATE [References] SET
          Title = @title,
          Url = @url,
          Source = @source,
          Type = @type
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function deleteReference(id) {
  try {
    const pool = await getDb();
  
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM [References] OUTPUT DELETED.* WHERE Id = @id');
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

export {
  getAllReferences,
  getReferenceById,
  getReferencesByTrend,
  getReferencesByTechnology,
  getReferencesPaginated,
  getReferencesCount,
  createReference,
  updateReference,
  deleteReference
};
