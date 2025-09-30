import express from 'express';
import { verifyAdminToken } from '../middleware/auth.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { 
  getDashboardStats, 
  getAllTechnologiesAdmin,
  getTechnologyByGeneratedIDAdmin,
  createTechnologyAdmin,
  updateTechnologyAdmin,
  archiveTechnologyAdmin,
  unarchiveTechnologyAdmin,
  publishTechnologyAdmin,
  getAllCommentsAdmin,
  createCommentAdmin,
  approveCommentAdmin,
  rejectCommentAdmin,
  deleteCommentAdmin,
  getAllReferencesAdmin,
  getReferenceByIdAdmin,
  createReferenceAdmin,
  updateReferenceAdmin,
  deleteReferenceAdmin,
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  getSystemInfo,
  editTechnologyAdmin
} from '../controllers/admin.controller.js';
import { deleteTechnologyHandler } from '../controllers/technologies.controller.js';
import { 
  getAllTrendsHandler,
  getTrendByGeneratedIDHandler,
  createTrendHandler,
  updateTrendHandler,
  deleteTrendHandler
} from '../controllers/trends.controller.js';
import { sendAdminNotification, sendEmail } from '../services/email.service.js';
import { getReferenceById } from '../models/reference.model.js';

const router = express.Router();

// Apply the verifyAdminToken middleware for all admin routes
router.use(verifyToken, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Technology management
router.get('/technologies', getAllTechnologiesAdmin);
router.get('/technologies/:generatedId', getTechnologyByGeneratedIDAdmin);
router.post('/technologies', createTechnologyAdmin);
router.put('/technologies/:generatedId', updateTechnologyAdmin);
router.put('/technologies/:generatedId/archive', archiveTechnologyAdmin);
router.put('/technologies/:generatedId/unarchive', unarchiveTechnologyAdmin);
router.put('/technologies/:generatedId/publish', publishTechnologyAdmin);
router.delete('/technologies/:generatedId', deleteTechnologyHandler);
router.get('/technologies/edit/:generatedId', editTechnologyAdmin);

// Trend management
router.get('/trends', getAllTrendsHandler);
router.get('/trends/:generatedId', getTrendByGeneratedIDHandler);
router.post('/trends', createTrendHandler);
router.put('/trends/:generatedId', updateTrendHandler);
router.delete('/trends/:generatedId', deleteTrendHandler);

// Comment management
router.get('/comments', getAllCommentsAdmin);
router.post('/comments', createCommentAdmin);
router.put('/comments/:id/approve', approveCommentAdmin);
router.put('/comments/:id/reject', rejectCommentAdmin);
router.delete('/comments/:id', deleteCommentAdmin);

// Reference management
router.get('/references', getAllReferencesAdmin);
router.get('/references/:id', getReferenceByIdAdmin);
router.post('/references/add/:type/:generatedId', createReferenceAdmin);
router.post('/references/add', createReferenceAdmin);   
router.put('/references/:id', updateReferenceAdmin);
router.delete('/references/:id', deleteReferenceAdmin);

// User management (super admin only)
router.get('/users', getAllAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:userId', updateAdminUser);

// System info
router.get('/system-info', getSystemInfo);

// Email notification endpoint
router.post('/notify', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { subject, message } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }
    
    await sendAdminNotification({ subject, message });
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Contact admin endpoint
router.post('/contact-admin', async (req, res) => {
  try {
    const { subject, message, email } = req.body;
    
    if (!subject || !message || !email) {
      return res.status(400).json({
        success: false,
        message: 'Subject, message, and email are required'
      });
    }
    
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject,
      text: message,
      email // This will be used in the subject line
    });
    
    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Export the router
export default router;
export const adminRoutes = router;