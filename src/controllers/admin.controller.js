import sql from 'mssql';
import { getDb } from '../config/database.js';
import {
  getAllTechnologies,
  createTechnology,
  updateTechnology,
  deleteTechnology,
  getTechnologyByLabel
} from '../models/technology.model.js';
import {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment
} from '../models/comment.model.js';
import {
  getAllReferences,
  getReferenceById,
  createReference,
  updateReference,
  deleteReference
} from '../models/reference.model.js';

/*Admin Dashboard Statistics*/
export const getDashboardStats = async (req, res) => {
  try {
    const pool = await getDb();

    // Run multiple queries in parallel for efficiency
    const [
      techCountResult,
      commentCountResult,
      refCountResult,
      recentTechResult,
      recentCommentsResult,
      pendingCommentsResult,
      draftTechnologiesResult,
      quadrantDistributionResult
    ] = await Promise.all([
      pool.request().query('SELECT COUNT(*) as count FROM Technology'),
      pool.request().query('SELECT COUNT(*) as count FROM Comments'),
      pool.request().query('SELECT COUNT(*) as count FROM [References]'),
      pool.request().query('SELECT TOP 5 * FROM Technology ORDER BY CreatedAt DESC'),
      pool.request().query('SELECT TOP 5 * FROM Comments ORDER BY CreatedAt DESC'),
      pool.request().query("SELECT COUNT(*) as count FROM Comments WHERE IsApproved IS NULL OR IsApproved = 'false'"),
      pool.request().query("SELECT COUNT(*) as count FROM Technology WHERE PublicationStatus = 'Draft'"),
      pool.request().query("SELECT Quadrant, COUNT(*) as count FROM Technology GROUP BY Quadrant")
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTechnologies: techCountResult.recordset[0].count,
        totalComments: commentCountResult.recordset[0].count,
        totalReferences: refCountResult.recordset[0].count,
        pendingComments: pendingCommentsResult.recordset[0].count,
        draftTechnologies: draftTechnologiesResult.recordset[0].count,
        quadrantDistribution: quadrantDistributionResult.recordset,
        recentTechnologies: recentTechResult.recordset,
        recentComments: recentCommentsResult.recordset
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const editTechnologyAdmin = async (req, res) => {
  try {
    const { label } = req.params;
    const technology = await getTechnologyByLabel(label);
    res.status(200).json({
      success: true,
      data: technology
    });
  } catch (error) {
    console.error('Error fetching technology for edit:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/* Technology Management */
export const getAllTechnologiesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, quadrant } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build dynamic query based on filters
    let query = 'SELECT * FROM Technology WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (TechnologyName LIKE @search OR Abstract LIKE @search OR Tags LIKE @search)';
      params.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
    }
    
    if (status) {
      query += ' AND PublicationStatus = @status';
      params.push({ name: 'status', type: sql.NVarChar, value: status });
    }
    
    if (quadrant) {
      query += ' AND Quadrant = @quadrant';
      params.push({ name: 'quadrant', type: sql.NVarChar, value: quadrant });
    }
    
    // Add pagination
    query += ' ORDER BY EditedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;';
    params.push({ name: 'offset', type: sql.Int, value: offset });
    params.push({ name: 'limit', type: sql.Int, value: parseInt(limit) });
    
    // Count total for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM Technology WHERE 1=1';
    
    if (search) {
      countQuery += ' AND (TechnologyName LIKE @search OR Abstract LIKE @search OR Tags LIKE @search)';
    }
    
    if (status) {
      countQuery += ' AND PublicationStatus = @status';
    }
    
    if (quadrant) {
      countQuery += ' AND Quadrant = @quadrant';
    }
    
    const pool = await getDb();
    
    // Create request and add parameters
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    // Execute both queries
    const dataResult = await request.query(query);
    
    // Reset request for count query
    const countRequest = pool.request();
    params.forEach(param => {
      if (param.name !== 'offset' && param.name !== 'limit') {
        countRequest.input(param.name, param.type, param.value);
      }
    });
    
    const countResult = await countRequest.query(countQuery);
    
    res.status(200).json({
      success: true,
      technologies: dataResult.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching all technologies for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const getTechnologyByLabelAdmin = async (req, res) => {
  try {
    const pool = await getDb();
    const { label } = req.params;
    
    const result = await pool.request()
      .input('label', sql.NVarChar, label)
      .query('SELECT * FROM Technology WHERE Label = @label');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    // Get related comments and references
    const [commentsResult, referencesResult] = await Promise.all([
      pool.request()
        .input('label', sql.NVarChar, label)
        .query('SELECT * FROM Comments WHERE Label = @label ORDER BY CreatedAt DESC'),
      pool.request()
        .input('label', sql.NVarChar, label)
        .query('SELECT * FROM [References] WHERE label = @label ORDER BY CreatedAt DESC')
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        technology: result.recordset[0],
        comments: commentsResult.recordset,
        references: referencesResult.recordset
      }
    });
  } catch (error) {
    console.error('Error fetching technology details:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const createTechnologyAdmin = async (req, res) => {
  try {
    // Add audit trail - record who created
    const technologyData = {
      ...req.body,
      CreatedBy: req.user.username,
      CreatedAt: new Date(),
      EditedAt: new Date(),
      PublicationStatus: req.body.PublicationStatus || 'Draft'
    };
    
    const technology = await createTechnology(technologyData);
    
    res.status(201).json({
      success: true,
      data: technology
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.statusCode ? error.message : 'Server Error',
      error: error.message
    });
  }
};

export const updateTechnologyAdmin = async (req, res) => {
  try {
    const technologyLabel = req.params.label;
    // Add audit trail
    const technologyData = {
      ...req.body,
      EditedAt: new Date()
    };
    
    const technology = await updateTechnology(technologyLabel, technologyData);
    
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: technology
    });
  } catch (error) {
    console.error('Error updating technology:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const archiveTechnologyAdmin = async (req, res) => {
  try {
    const pool = await getDb();
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('archived', sql.Bit, 1)
      .input('editedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Technology 
        SET Archived = @archived, EditedAt = @editedAt
        OUTPUT INSERTED.*
        WHERE ID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Technology archived successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error archiving technology:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const unarchiveTechnologyAdmin = async (req, res) => {
  try {
    const pool = await getDb();
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('archived', sql.Bit, 0)
      .input('editedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Technology 
        SET Archived = @archived, EditedAt = @editedAt
        OUTPUT INSERTED.*
        WHERE ID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Technology unarchived successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error unarchiving technology:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const publishTechnologyAdmin = async (req, res) => {
  try {
    const pool = await getDb();
    const { id } = req.params;
    const { status } = req.body; // 'Published' or 'Draft'
    
    if (!status || !['Published', 'Draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid publication status'
      });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .input('editedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Technology 
        SET PublicationStatus = @status, EditedAt = @editedAt
        OUTPUT INSERTED.*
        WHERE ID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Technology ${status === 'Published' ? 'published' : 'set to draft'} successfully`,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error updating publication status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/* Comment Management */
export const getAllCommentsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, Label } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const pool = await getDb();
    
    // Build dynamic query with parameters
    let queryParams = [];
    let whereClause = '';
    
    if (status === 'approved') {
      whereClause += whereClause ? " AND C.IsApproved = 'true'" : " WHERE C.IsApproved = 'true'";
    } else if (status === 'pending') {
      whereClause += whereClause ? " AND (C.IsApproved IS NULL OR C.IsApproved = 'false')" : " WHERE (C.IsApproved IS NULL OR C.IsApproved = 'false')";
    }
    
    if (Label) {
      whereClause += whereClause ? " AND C.Label = @Label" : " WHERE C.Label = @Label";
      queryParams.push({ name: 'Label', type: sql.NVarChar, value: Label });
    }
    
    const query = `
      SELECT C.*, T.Name 
      FROM Comments C
      LEFT JOIN Technology T ON C.Label = T.Label
      ${whereClause}
      ORDER BY C.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY;
      
      SELECT COUNT(*) as total 
      FROM Comments C
      LEFT JOIN Technology T ON C.Label = T.Label
      ${whereClause};
    `;
    
    // Create request and add parameters
    const request = pool.request();
    
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(query);
    
    res.status(200).json({
      success: true,
      comments: result.recordsets[0],
      total: result.recordsets[1][0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.recordsets[1][0].total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching all comments for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const createCommentAdmin = async (req, res) => {
  try {
    const comment = await createComment({
      ...req.body,
      CreatedBy: req.user.username,
      CreatedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const approveCommentAdmin = async (req, res) => {
  try {
    const pool = await getDb();
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('approvedAt', sql.DateTime, new Date())
      .input('approvedBy', sql.NVarChar, req.user.username)
      .query(`
        UPDATE Comments 
        SET IsApproved = 'true', ApprovedAt = @approvedAt, ApprovedBy = @approvedBy
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Comment approved successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const rejectCommentAdmin = async (req, res) => {
  try {
    const pool = await getDb();
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('rejectedAt', sql.DateTime, new Date())
      .input('rejectedBy', sql.NVarChar, req.user.username)
      .input('rejectionReason', sql.NVarChar, reason || null)
      .query(`
        UPDATE Comments 
        SET IsApproved = 'false', 
            RejectedAt = @rejectedAt, 
            RejectedBy = @rejectedBy,
            RejectionReason = @rejectionReason
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Comment rejected successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error rejecting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const deleteCommentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedComment = await deleteComment(id);
    
    if (!deletedComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/* Reference Management */
export const getAllReferencesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, Label } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const pool = await getDb();
    
    let query, params = [];
    
    if (Label) {
      query = `
        SELECT R.*, T.Name
        FROM [References] R
        JOIN Technology T ON R.Label = T.Label
        WHERE R.Label = @Label
        ORDER BY R.Id DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
        
        SELECT COUNT(*) as total 
        FROM [References]
        WHERE Label = @Label;
      `;
      params.push({ name: 'Label', type: sql.NVarChar, value: Label });
    } else {
      query = `
        SELECT R.*, T.Name
        FROM [References] R
        JOIN Technology T ON R.Label = T.Label
        ORDER BY R.Id DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
        
        SELECT COUNT(*) as total FROM [References];
      `;
    }
    
    const request = pool.request();
    
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(query);
    
    res.status(200).json({
      success: true,
      references: result.recordsets[0],
      total: result.recordsets[1][0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.recordsets[1][0].total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching references for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const getReferenceByIdAdmin = async (req, res) => {
  try {
    const reference = await getReferenceById(req.params.id);
    if (!reference) {
      return res.status(404).json({
        success: false,
        message: 'Reference not found'
      });
    }
    res.status(200).json({
      success: true,
      data: reference
    });
  }
  catch (error) {
    console.error('Error fetching reference by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const createReferenceAdmin = async (req, res) => {
  try {
    const reference = await createReference({
      ...req.body,
      CreatedBy: req.user.username,
      CreatedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Reference created successfully',
      data: reference
    });
  } catch (error) {
    console.error('Error creating reference:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const updateReferenceAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reference = await updateReference(id, {
      ...req.body,
      UpdatedBy: req.user.username,
      UpdatedAt: new Date()
    });
    
    if (!reference) {
      return res.status(404).json({
        success: false,
        message: 'Reference not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Reference updated successfully',
      data: reference
    });
  } catch (error) {
    console.error('Error updating reference:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const deleteReferenceAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedReference = await deleteReference(id);
    
    if (!deletedReference) {
      return res.status(404).json({
        success: false,
        message: 'Reference not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Reference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reference:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/* User Management */
export const getAllAdminUsers = async (req, res) => {
  try {
    const pool = await getDb();
    
    // Don't return password fields
    const result = await pool.request().query(`
      SELECT id, username, email, lastLogin, createdAt, isActive 
      FROM Admins 
      ORDER BY username
    `);
    
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    const pool = await getDb();
    
    // Check if user already exists
    const existingUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Admins WHERE username = @username OR email = @email');
    
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // In production, hash the password - here just for demonstration
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password) // In production, use hashedPassword
      .input('createdAt', sql.DateTime, new Date())
      .input('isActive', sql.Bit, 1)
      .query(`
        INSERT INTO Admins (username, email, password, createdAt, isActive)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.createdAt, INSERTED.isActive
        VALUES (@username, @email, @password, @createdAt, @isActive)
      `);
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, isActive } = req.body;
    
    const pool = await getDb();
    
    // Check if user exists
    const existingUser = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Admins WHERE id = @id');
    
    if (existingUser.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }
    
    // Build dynamic update
    const updates = [];
    const inputs = [{ name: 'id', type: sql.Int, value: id }];
    
    if (email) {
      updates.push('email = @email');
      inputs.push({ name: 'email', type: sql.NVarChar, value: email });
    }
    
    if (password) {
      // In production, hash the password
      // const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = @password');
      inputs.push({ name: 'password', type: sql.NVarChar, value: password }); // Use hashedPassword in production
    }
    
    if (isActive !== undefined) {
      updates.push('isActive = @isActive');
      inputs.push({ name: 'isActive', type: sql.Bit, value: isActive ? 1 : 0 });
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    const query = `
      UPDATE Admins
      SET ${updates.join(', ')}
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.lastLogin, INSERTED.isActive
      WHERE id = @id
    `;
    
    const request = pool.request();
    
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    const result = await request.query(query);
    
    res.status(200).json({
      success: true,
      message: 'Admin user updated successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/* System Management */
export const getSystemInfo = async (req, res) => {
  try {
    const pool = await getDb();
    
    // Get database info
    const dbInfoResult = await pool.request().query(`
      SELECT 
        DB_NAME() as databaseName,
        SUSER_SNAME() as currentUser,
        @@version as sqlVersion
    `);
    
    // Get table counts
    const [
      techCount,
      commentCount,
      referenceCount,
      adminCount
    ] = await Promise.all([
      pool.request().query('SELECT COUNT(*) as count FROM Technology'),
      pool.request().query('SELECT COUNT(*) as count FROM Comments'),
      pool.request().query('SELECT COUNT(*) as count FROM [References]'),
      pool.request().query('SELECT COUNT(*) as count FROM Admins')
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        database: dbInfoResult.recordset[0],
        counts: {
          technologies: techCount.recordset[0].count,
          comments: commentCount.recordset[0].count,
          references: referenceCount.recordset[0].count,
          admins: adminCount.recordset[0].count
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          serverTime: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
