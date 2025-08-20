import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { 
  getCommentsByTechnologyHandler,
  getCommentsCountHandler,
  createCommentHandler,
  getCommentsByTrendHandler,
  getCommentsByTypeHandler
} from '../controllers/comments.controller.js';

const router = express.Router();

router.use(verifyToken);

// Static routes first
router.get('/count', getCommentsCountHandler);

// Generic parameterized route last
router.get('/:type/:label', (req, res, next) => {
  next();
}, getCommentsByTypeHandler);

// Specific parameterized routes
router.get('/technology/:label', getCommentsByTechnologyHandler);
router.get('/trend/:label', getCommentsByTrendHandler);



router.post('/:type/:label', createCommentHandler);

export { router as commentsRoutes };
