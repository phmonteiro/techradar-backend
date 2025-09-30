import express from 'express';

import { 
    getAllTrendsHandler, 
    getTrendByIdHandler, 
    getTrendByGeneratedIDHandler, 
    getTrendsCountHandler,
    createTrendHandler, 
    updateTrendHandler, 
    deleteTrendHandler,
    getTrendsByQuadrantHandler,
    getTrendsByRingHandler,
    getUserLikeStatusByTrendGeneratedIDHandler,
    getLikesByTrendGeneratedIDHandler,
    likeTrendByGeneratedIDHandler,
    updateTrendStageHandler
} from '../controllers/trends.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Debug middleware to log all trend route hits
router.use((req, res, next) => {
    console.log(`🔍 [TRENDS ROUTE] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log(`🔍 [TRENDS ROUTE] Request params:`, req.params);
    console.log(`🔍 [TRENDS ROUTE] Request query:`, req.query);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        console.log(`🔍 [TRENDS ROUTE] Request body:`, req.body);
    }
    next();
});

// Get all trends
router.get('/', getAllTrendsHandler);

// Apply the verifyToken middleware for all admin routes below this line
router.use(verifyToken);

// Get trends count
router.get('/count', getTrendsCountHandler);

// Get trend by GeneratedID
router.get('/:generatedId', getTrendByGeneratedIDHandler);

// Get likes by trend GeneratedID
router.get('/:generatedId/likes', getLikesByTrendGeneratedIDHandler);

// Like trend by GeneratedID
router.post('/:generatedId/like', likeTrendByGeneratedIDHandler);

// Get user like status by trend GeneratedID
router.get('/:generatedId/likes/status', getUserLikeStatusByTrendGeneratedIDHandler);

// Update trend stage
router.patch('/:generatedId/stage', updateTrendStageHandler);

// Get trends by quadrant
router.get('/quadrant/:quadrantId', getTrendsByQuadrantHandler);

// Get trends by ring
router.get('/ring/:ringId', getTrendsByRingHandler);

// Create new trend
router.post('/', createTrendHandler);

// Update trend
router.put('/:id', updateTrendHandler);

// Delete trend
router.delete('/:generatedId', deleteTrendHandler);

// Export for ES modules
export const trendsRoutes = router;
export default router;
