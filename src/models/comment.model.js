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
async function getCommentsByType(type, label) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('type', sql.NVarChar, type)
      .input('label', sql.NVarChar, label)
      .query('SELECT * FROM Comments WHERE Type = @type AND Label = @label');
    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getCommentsByTrend(label) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query('SELECT * FROM Comments WHERE Label = @label');
    return result.recordset;
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

async function getCommentsByTechnology(label) {

  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query('SELECT * FROM Comments WHERE label = @label ORDER BY CreatedAt DESC');
    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    return result.recordset;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getCommentsPaginated(page = 1, limit = 10, TechnologyLabel = null) {
  try {
    const pool = await getDb();
    const offset = (page - 1) * limit;
    let result;
    
    if (TechnologyLabel) {
      result = await pool.request()
        .input('TechnologyLabel', sql.NVarChar, TechnologyLabel)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT C.*, T.Name as TechnologyName 
          FROM Comments C
          JOIN Technologies T ON C.TechnologyLabel = T.Label
          WHERE C.TechnologyLabel = @TechnologyLabel
          ORDER BY C.CreatedAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
          
          SELECT COUNT(*) as total FROM Comments 
          WHERE TechnologyLabel = @technologyLabel;
        `);
    } else {
      result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT C.*, T.Name as TechnologyName 
          FROM Comments C
          JOIN Technologies T ON C.TechnologyLabel = T.Label
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
      .input('label', sql.NVarChar, commentData.label)
      .input('type', sql.NVarChar, commentData.type)
      .input('author', sql.NVarChar, commentData.author)
      .input('text', sql.NVarChar, commentData.text)	
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Comments (
          Label, Type, Text, Author, CreatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @label, @type, @text, @author, @createdAt
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
