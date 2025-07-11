import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import sql from 'mssql';
import { getDb } from '../config/database.js';
import bcrypt from 'bcryptjs'; // You'll need to install this package

dotenv.config();

/**
 * Unified login controller supporting role-based authentication
 * Follows Azure security best practices for identity management
 */
export const login = async (req, res) => {
  const startTime = Date.now(); // For performance tracking
  
  try {
    const { usernameCredential, password } = req.body;

    // Input validation
    if (!usernameCredential || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    // Azure best practice: Add throttling for brute force protection
    // This would typically be implemented via middleware

    // Connect to database with retry logic for transient failures
    const pool = await getDbWithRetry();
    
    // Query to find user with role information
    const result = await pool.request()
      .input('username', sql.NVarChar, usernameCredential)
      .query(`
        SELECT 
          id AS userId, 
          username,
          displayName, 
          password AS passwordHash, 
          role,
          lastLoginAt,
          isActive
        FROM Users 
        WHERE username = @username
      `);

    const user = result.recordset[0];
    
    // Check if user exists
    if (!user) {
      // Azure best practice: Use consistent error messages for auth failures
      // to prevent username enumeration attacks
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Azure best practice: Check if account is active/enabled
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Please contact support.'
      });
    }
    
    // Azure best practice: Use proper password hashing and comparison
    // If you haven't implemented hashing yet, modify this condition temporarily
    let passwordValid;
    
    if (process.env.NODE_ENV === 'production') {
      // In production: Always use bcrypt for password verification
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // During development/migration: Support direct comparison if needed
      // IMPORTANT: Remove this fallback in production!
      const isHashed = user.passwordHash.startsWith('$2') && user.passwordHash.length > 50;
      passwordValid = isHashed 
        ? await bcrypt.compare(password, user.passwordHash)
        : password === user.passwordHash;
    }

    if (!passwordValid) {
      // Azure best practice: Log failed login attempts but don't expose details in response
      console.warn(`Failed login attempt for user: ${username}`);
      
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Azure best practice: Include standard claims in the token
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = { 
      sub: user.userId.toString(), // Subject claim (user identifier)
      username: user.username,
      displayName: user.displayName,
      role: user.role || 'viewer', // Default to viewer if role is not set
      iat: now, // Issued at claim
      nbf: now, // Not before claim
      jti: generateUniqueId(), // JWT ID claim for token revocation support
    };
    
    // Generate JWT token with Azure recommended settings
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXP || '8h',
        issuer: process.env.JWT_ISSUER || 'techradar',
        audience: process.env.JWT_AUDIENCE || 'techradar-api',
      }
    );
    
    // Update last login timestamp in database
    await pool.request()
      .input('userId', sql.Int, user.userId)
      .input('lastLogin', sql.DateTime2, new Date())
      .query('UPDATE Users SET lastLoginAt = @lastLogin WHERE id = @userId');
    
    // Log successful login for security audit
    console.log(`User ${usernameCredential} logged in successfully with role: ${user.role}`);
    
    // Azure best practice: Only return necessary user information
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.userId,
        username: user.username,
        role: user.role || 'viewer',
        token
      }
    });
    
    // Azure best practice: Log authentication performance metrics
    const duration = Date.now() - startTime;
    console.log(`Login operation completed in ${duration}ms`);
    
  } catch (error) {
    // Azure best practice: Enhanced error logging with proper redaction of sensitive data
    console.error('Login error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      username: req.body.username ? '***REDACTED***' : undefined
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

/**
 * Helper function to get database connection with retry logic
 * Azure best practice: Handle transient failures in Azure SQL Database
 */
async function getDbWithRetry(maxRetries = 3) {
  let attempt = 0;
  let lastError;
  
  while (attempt < maxRetries) {
    try {
      return await getDb();
    } catch (error) {
      attempt++;
      lastError = error;
      
      // Azure SQL transient error codes
      const transientErrors = [4060, 40197, 40501, 40613, 49918, 49919, 49920, 11001];
      const isTransient = transientErrors.includes(error.number);
      
      if (!isTransient || attempt >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(100 * Math.pow(2, attempt) + Math.random() * 100, 3000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Generate a unique ID for JWT tokens
 * Azure best practice: Ensure each token has a unique identifier
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Validate token endpoint for frontend checks
export const validateToken = (req, res) => {
  // The verifyToken middleware has already validated the token if we reach here
  res.status(200).json({ 
    success: true,
    valid: true, 
    user: {
      userId: req.user.sub,
      username: req.user.username,
      role: req.user.role
    }
  });
};
