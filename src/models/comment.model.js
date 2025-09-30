import sql from 'mssql';
import { getDb } from '../config/database.js';

async function getAllComments() {
  try {
    const pool = await getDb();
    const result = await pool.request().query('SELECT * FROM Comments');
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}
async function getCommentsByType(type, generatedId, page = 1, limit = 10) {
  try {
    const pool = await getDb();
    const offset = (page - 1) * limit;
    
    const result = await pool.request()
      .input('type', sql.NVarChar, type)
      .input('generatedId', sql.NVarChar, generatedId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT * FROM Comments 
        WHERE Type = @type AND GeneratedID = @generatedId 
        ORDER BY CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
        
        SELECT COUNT(*) as total FROM Comments 
        WHERE Type = @type AND GeneratedID = @generatedId;
      `);
    
    return {
      comments: result.recordsets[0] || [],
      total: result.recordsets[1] ? result.recordsets[1][0].total : 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: result.recordsets[1] ? Math.ceil(result.recordsets[1][0].total / limit) : 0
    };
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getCommentsByTrend(generatedId, page = 1, limit = 10) {
  try {
    const pool = await getDb();
    const offset = (page - 1) * limit;
    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT * FROM Comments 
        WHERE GeneratedID = @generatedId 
        ORDER BY CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
        
        SELECT COUNT(*) as total FROM Comments 
        WHERE GeneratedID = @generatedId;
      `);
    
    return {
      comments: result.recordsets[0] || [],
      total: result.recordsets[1] ? result.recordsets[1][0].total : 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: result.recordsets[1] ? Math.ceil(result.recordsets[1][0].total / limit) : 0
    };
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getCommentById(id) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Comments WHERE Id = @id');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getCommentsByTechnology(generatedId, page = 1, limit = 10) {
  try {
    const pool = await getDb();
    const offset = (page - 1) * limit;
    
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, generatedId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT * FROM Comments 
        WHERE GeneratedID = @generatedId 
        ORDER BY CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
        
        SELECT COUNT(*) as total FROM Comments 
        WHERE GeneratedID = @generatedId;
      `);
    
    return {
      comments: result.recordsets[0] || [],
      total: result.recordsets[1] ? result.recordsets[1][0].total : 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: result.recordsets[1] ? Math.ceil(result.recordsets[1][0].total / limit) : 0
    };
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getCommentsPaginated(page = 1, limit = 10, search = '') {
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
          SELECT C.*, 
                 CASE 
                   WHEN C.Type = 'technology' THEN T.Name
                   WHEN C.Type = 'trend' THEN TR.Name
                   ELSE C.GeneratedID
                 END as ItemName,
                 T.Name as TechnologyName
          FROM Comments C
          LEFT JOIN Technology T ON C.GeneratedID = T.GeneratedID AND (C.Type = 'technology' OR C.Type IS NULL)
          LEFT JOIN Trends TR ON C.GeneratedID = TR.GeneratedID AND C.Type = 'trend'
          WHERE C.Text LIKE @search 
             OR C.Author LIKE @search
             OR T.Name LIKE @search
             OR TR.Name LIKE @search
          ORDER BY C.CreatedAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Comments C
          LEFT JOIN Technology T ON C.GeneratedID = T.GeneratedID AND (C.Type = 'technology' OR C.Type IS NULL)
          LEFT JOIN Trends TR ON C.GeneratedID = TR.GeneratedID AND C.Type = 'trend'
          WHERE C.Text LIKE @search 
             OR C.Author LIKE @search
             OR T.Name LIKE @search
             OR TR.Name LIKE @search;
        `);
    } else {
      result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT C.*, 
                 CASE 
                   WHEN C.Type = 'technology' THEN T.Name
                   WHEN C.Type = 'trend' THEN TR.Name
                   ELSE C.GeneratedID
                 END as ItemName,
                 T.Name as TechnologyName
          FROM Comments C
          LEFT JOIN Technology T ON C.GeneratedID = T.GeneratedID AND (C.Type = 'technology' OR C.Type IS NULL)
          LEFT JOIN Trends TR ON C.GeneratedID = TR.GeneratedID AND C.Type = 'trend'
          ORDER BY C.CreatedAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Comments;
        `);
    }
    
    return {
      comments: result.recordsets[0],
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

async function getCommentsCount() {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .query('SELECT COUNT(*) as count FROM [dbo].[Comments]');
    
    return result.recordset[0].count;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function createComment(commentData) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('generatedId', sql.NVarChar, commentData.GeneratedID || commentData.Label || commentData.label)
      .input('type', sql.NVarChar, commentData.Type || commentData.type || 'technology')
      .input('author', sql.NVarChar, commentData.Author || commentData.author)
      .input('email', sql.NVarChar, commentData.Email || commentData.email)
      .input('text', sql.NVarChar, commentData.Text || commentData.text)
      .input('isApproved', sql.Bit, commentData.IsApproved || false)
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Comments (
          GeneratedID, Type, Text, Author, Email, IsApproved, CreatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @generatedId, @type, @text, @author, @email, @isApproved, @createdAt
        )
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function updateComment(id, commentData) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('content', sql.NVarChar, commentData.Content)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Comments SET
          Content = @content,
          UpdatedAt = @updatedAt
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function deleteComment(id) {
  try {
    const pool = await getDb();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Comments OUTPUT DELETED.* WHERE Id = @id');
    
    return result.recordset[0];
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

export {
  getAllComments,
  getCommentsCount,
  getCommentById,
  getCommentsByTechnology,
  getCommentsPaginated,
  createComment,
  updateComment,
  deleteComment,
  getCommentsByTrend,
  getCommentsByType
};
