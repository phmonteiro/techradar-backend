import express from 'express';

import { 
    getAllTrendsHandler, 
    getTrendByIdHandler, 
    getTrendByLabelHandler, 
    getTrendsCountHandler,
    createTrendHandler, 
    updateTrendHandler, 
    deleteTrendHandler,
    getTrendsByQuadrantHandler,
    getTrendsByRingHandler,
    getUserLikeStatusByTrendLabelHandler,
    getLikesByTrendLabelHandler,
    likeTrendByLabelHandler,
    updateTrendStageHandler
} from '../controllers/trends.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all trends
router.get('/', getAllTrendsHandler);

// Apply the verifyAdminToken middleware for all admin routes below this line
router.use(verifyToken);

// Get trends count
router.get('/count', getTrendsCountHandler);

// Get trend by ID
router.get('/:label', getTrendByLabelHandler);

// Get likes by trend label
router.get('/:label/likes', getLikesByTrendLabelHandler);

// Like trend by label
router.post('/:label/like', likeTrendByLabelHandler);

// Get user like status by trend label
router.get('/:label/likes/status', getUserLikeStatusByTrendLabelHandler);

// Update trend stage
router.patch('/:label/stage', updateTrendStageHandler);

// Get trends by quadrant
router.get('/quadrant/:quadrantId', getTrendsByQuadrantHandler);

// Get trends by ring
router.get('/ring/:ringId', getTrendsByRingHandler);

// Create new trend
router.post('/', createTrendHandler);

// Update trend
router.put('/:id', updateTrendHandler);

// Delete trend
router.delete('/:id', deleteTrendHandler);

// Export for ES modules
export const trendsRoutes = router;
export default router;
