import sql from 'mssql';
import { getDb } from '../config/database.js';

async function getLikesByReference(referenceId, referenceType) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('referenceId', sql.Int, referenceId)
      .input('referenceType', sql.NVarChar, referenceType)
      .query(`
        SELECT COUNT(*) as count 
        FROM [dbo].[Likes] 
        WHERE ReferenceId = @referenceId 
        AND ReferenceType = @referenceType
      `);
    
    return result.recordset[0].count;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function getUserLikeStatus(userId, referenceId, referenceType) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('referenceId', sql.Int, referenceId)
      .input('referenceType', sql.NVarChar, referenceType)
      .query(`
        SELECT COUNT(*) as count 
        FROM [dbo].[Likes] 
        WHERE UserId = @userId 
        AND ReferenceId = @referenceId 
        AND ReferenceType = @referenceType
      `);
    
    return result.recordset[0].count > 0;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function addLike(userId, referenceId, referenceType) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('referenceId', sql.Int, referenceId)
      .input('referenceType', sql.NVarChar, referenceType)
      .query(`
        INSERT INTO [dbo].[Likes] (UserId, ReferenceId, ReferenceType, CreatedAt)
        VALUES (@userId, @referenceId, @referenceType, GETDATE())
      `);
    
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

async function removeLike(userId, referenceId, referenceType) {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('referenceId', sql.Int, referenceId)
      .input('referenceType', sql.NVarChar, referenceType)
      .query(`
        DELETE FROM [dbo].[Likes] 
        WHERE UserId = @userId 
        AND ReferenceId = @referenceId 
        AND ReferenceType = @referenceType
      `);
    
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

export {
  getLikesByReference,
  getUserLikeStatus,
  addLike,
  removeLike
}; 