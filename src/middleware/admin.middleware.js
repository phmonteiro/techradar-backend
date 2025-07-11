/**
 * Authorization middleware to check if authenticated user has admin privileges
 * This middleware should be used after the verifyToken middleware
 * Implements Azure RBAC best practices for JWT claims verification
 */
const requireAdmin = (req, res, next) => {
  try {
    // Verify that req.user exists, meaning verifyToken ran successfully
    if (!req.user) {
      console.warn('Authorization failed: No user object in request');
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - Authentication required' 
      });
    }

    // Check if user has Admin role - case sensitive comparison
    if (req.user.role !== 'Admin') {
      console.warn(`Authorization failed: User ${req.user.username} has role ${req.user.role}, Admin required`);
      return res.status(403).json({ 
        success: false,
        message: 'Forbidden - Admin privileges required' 
      });
    }

    // Add role verification timestamp for audit logging
    req.user.roleVerifiedAt = new Date().toISOString();
    
    next();
  } catch (error) {
    console.error('Error in admin authorization middleware:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error during authorization' 
    });
  }
};

// Export for ES modules
export { requireAdmin };
