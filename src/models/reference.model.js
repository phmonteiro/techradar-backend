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

async function getReferencesByTrend(label) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query(`SELECT * FROM [References] WHERE Label = @label AND Type = 'Trend' ORDER BY Label`);
    return result.recordset;
  } catch (err) {
    console.error(`Database query failed in getReferencesByTrend(${label}):`, err);
    throw err;
  }
}

async function getReferenceById(id) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM [techradar].dbo.[References] WHERE Id = @id');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getReferencesByTechnology(label) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query(`SELECT * FROM [References] WHERE Label = @label and Type = 'Technology' ORDER BY Label`);
    
    return result.recordset;
  } catch (err) {
    console.error(`Database query failed in getReferencesByTechnology(${label}):`, err);
    throw err;
  }
}

async function getReferencesPaginated(page = 1, limit = 10, search = '', Label = null) {
  try {
    const pool = await getDb();
    const offset = (page - 1) * limit;
    let result;
    
    if (Label && search) {
      result = await pool.request()
        .input('Label', sql.Int, Label)
        .input('search', sql.NVarChar, `%${search}%`)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT R.*, T.Name as TechnologyName 
          FROM [dbo].[References] R
          JOIN Technologies T ON R.Label = T.Id
          WHERE R.Label = @Label 
          AND (R.Title LIKE @search OR R.Url LIKE @search)
          ORDER BY R.Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM [dbo].[References] 
          WHERE Label = @Label
          AND (Title LIKE @search OR Url LIKE @search);
        `);
    } else if (Label) {
      result = await pool.request()
        .input('Label', sql.Int, Label)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT R.*, T.Name as TechnologyName 
          FROM [dbo].[References] R
          JOIN Technologies T ON R.Label = T.Label
          WHERE R.Label = @Label
          ORDER BY R.Id DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM [dbo].[References]
          WHERE Label = @Label;
        `);
    } else if (search) {
      result = await pool.request()
        .input('search', sql.NVarChar, `%${search}%`)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT R.*, T.Name as TechnologyName 
          FROM [dbo].[References] R
          JOIN Technologies T ON R.Label = T.Label
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
          JOIN Technologies T ON R.Label = T.Label
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
      .input('Label', sql.NVarChar, referenceData.Label)
      .input('title', sql.NVarChar, referenceData.Title)
      .input('url', sql.NVarChar, referenceData.Url)
      .input('type', sql.NVarChar, referenceData.Type )
      .query(`
        INSERT INTO [References] (
            Label, Title, Url, Type)
        OUTPUT INSERTED.*
        VALUES (
          @Label, @title, @url, @type
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
      .input('description', sql.NVarChar, referenceData.Description || null)
      .input('type', sql.NVarChar, referenceData.Type || 'Link')
      .query(`
        UPDATE References SET
          Title = @title,
          Url = @url,
          Description = @description,
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
