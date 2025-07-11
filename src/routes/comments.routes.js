import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getCommentsByTechnologyHandler,
         getCommentsCountHandler,
        createCommentHandler,
        getCommentsByTrendHandler,
        getCommentsByTypeHandler
 } from '../controllers/comments.controller.js';

// Create a router object
const router = express.Router();

// Apply the verifyAdminToken middleware for all admin routes below this line
router.use(verifyToken);

// GET all comments for a specific technology
router.get('/technology/:label', getCommentsByTechnologyHandler);

router.get('/trend/:label', getCommentsByTrendHandler);

// router.get('/:type/:label', getCommentsByTypeHandler);

router.get('/:type/:label', (req, res, next) => {
        console.log('Route hit:', req.params);
        next();
      }, getCommentsByTypeHandler);

router.get('/count', getCommentsCountHandler);

router.post('/technology/:label', createCommentHandler)

export { router as commentsRoutes };
