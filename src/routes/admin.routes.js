import express from 'express';
import { verifyAdminToken } from '../middleware/auth.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { 
  getDashboardStats, 
  getAllTechnologiesAdmin,
  getTechnologyByLabelAdmin,
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
  getTrendByLabelHandler,
  createTrendHandler,
  updateTrendHandler,
  deleteTrendHandler
} from '../controllers/trends.controller.js';
import { sendAdminNotification, sendEmail } from '../services/email.service.js';

const router = express.Router();

// Apply the verifyAdminToken middleware for all admin routes
router.use(verifyToken, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Technology management
router.get('/technologies', getAllTechnologiesAdmin);
router.get('/technologies/:label', getTechnologyByLabelAdmin);
router.post('/technologies', createTechnologyAdmin);
router.put('/technologies/:label', updateTechnologyAdmin);
router.put('/technologies/:label/archive', archiveTechnologyAdmin);
router.put('/technologies/:label/unarchive', unarchiveTechnologyAdmin);
router.put('/technologies/:label/publish', publishTechnologyAdmin);
router.delete('/technologies/:label', deleteTechnologyHandler);
router.get('/technologies/edit/:label', editTechnologyAdmin);

// Trend management
router.get('/trends', getAllTrendsHandler);
router.get('/trends/:label', getTrendByLabelHandler);
router.post('/trends', createTrendHandler);
router.put('/trends/:label', updateTrendHandler);
router.delete('/trends/:label', deleteTrendHandler);

// Comment management
router.get('/comments', getAllCommentsAdmin);
router.post('/comments', createCommentAdmin);
router.put('/comments/:label/approve', approveCommentAdmin);
router.put('/comments/:label/reject', rejectCommentAdmin);
router.delete('/comments/:label', deleteCommentAdmin);

// Reference management
router.get('/references', getAllReferencesAdmin);
router.post('/references', createReferenceAdmin);
router.put('/references/:label', updateReferenceAdmin);
router.delete('/references/:id', deleteReferenceAdmin);

// User management (super admin only)
router.get('/users', getAllAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:label', updateAdminUser);

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