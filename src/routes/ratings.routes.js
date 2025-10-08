import express from 'express';
import {
  getRatingsForItem,
  getAverageRatingsForItem,
  getUserRatingsForItem,
  updateItemRatings,
  deleteItemRating,
  getRatingTypes
} from '../controllers/ratings.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/types/:itemType', getRatingTypes); // Get rating configuration for an item type
router.get('/average/:itemType/:generatedId', getAverageRatingsForItem); // Get average ratings for display
router.get('/:itemType/:generatedId', getRatingsForItem); // Legacy route - returns average ratings

// Protected routes (require authentication)
router.get('/user/:itemType/:generatedId', verifyToken, getUserRatingsForItem); // Get user-specific ratings for modal
router.put('/:itemType/:generatedId', verifyToken, updateItemRatings); // Update ratings for an item
router.delete('/:itemType/:generatedId/:ratingKey', verifyToken, deleteItemRating); // Delete a specific rating

export { router as ratingsRoutes };