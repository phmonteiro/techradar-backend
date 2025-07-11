import sql from 'mssql';
import { getDb } from '../config/database.js';

/**
 * Get all users (Admin-only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT UserId, Username, Email, FirstName, LastName, Role, IsActive, CreatedAt, UpdatedAt, LastLoginAt
      FROM Users
      ORDER BY Username
    `);

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get a user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getDb();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT UserId, Username, Email, FirstName, LastName, Role, IsActive, CreatedAt, UpdatedAt, LastLoginAt
        FROM Users
        WHERE UserId = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Create a new user (Admin-only)
 */
export const createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and role are required',
      });
    }

    const pool = await getDb();

    // Check if username or email already exists
    const existingUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT UserId FROM Users WHERE Username = @username OR Email = @email
      `);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Insert new user
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, password) // Hash the password in production
      .input('firstName', sql.NVarChar, firstName || null)
      .input('lastName', sql.NVarChar, lastName || null)
      .input('role', sql.NVarChar, role)
      .input('isActive', sql.Bit, 1)
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, FirstName, LastName, Role, IsActive, CreatedAt)
        OUTPUT INSERTED.UserId, INSERTED.Username, INSERTED.Email, INSERTED.Role, INSERTED.CreatedAt
        VALUES (@username, @email, @passwordHash, @firstName, @lastName, @role, @isActive, @createdAt)
      `);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Update a user (Admin-only)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive } = req.body;

    const pool = await getDb();

    // Check if user exists
    const existingUser = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT UserId FROM Users WHERE UserId = @id');

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('email', sql.NVarChar, email || null)
      .input('firstName', sql.NVarChar, firstName || null)
      .input('lastName', sql.NVarChar, lastName || null)
      .input('role', sql.NVarChar, role || null)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : null)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Users
        SET 
          Email = COALESCE(@email, Email),
          FirstName = COALESCE(@firstName, FirstName),
          LastName = COALESCE(@lastName, LastName),
          Role = COALESCE(@role, Role),
          IsActive = COALESCE(@isActive, IsActive),
          UpdatedAt = @updatedAt
        OUTPUT INSERTED.UserId, INSERTED.Username, INSERTED.Email, INSERTED.Role, INSERTED.UpdatedAt
        WHERE UserId = @id
      `);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Delete a user (Admin-only)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getDb();

    // Check if user exists
    const existingUser = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT UserId FROM Users WHERE UserId = @id');

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete user
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE UserId = @id');

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};