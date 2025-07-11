import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getLikeCount,
  getLikeStatus,
  addLikeToReference,
  removeLikeFromReference
} from '../controllers/likes.controller.js';

const router = express.Router();

// Get like count for a reference
router.post('/count', getLikeCount);

// Get user's like status for a reference
router.post('/status', verifyToken, getLikeStatus);

// Add a like
router.post('/like', verifyToken, addLikeToReference);

// Remove a like
router.post('/unlike', verifyToken, removeLikeFromReference);

export { router as likesRoutes }; 