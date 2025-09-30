import express from 'express';

import { 
    getAllTechnologiesHandler, 
    getTechnologyByIdHandler, 
    getTechnologyByGeneratedIDHandler, 
    getTechnologiesCountHandler,
    createTechnologyHandler, 
    updateTechnologyHandler, 
    deleteTechnologyHandler,
    getTechnologiesByQuadrantHandler,
    getTechnologiesByRingHandler,
    getUserLikeStatusByTechnologyGeneratedIDHandler,
    getLikesByTechnologyGeneratedIDHandler,
    likeTechnologyByGeneratedIDHandler,
    updateTechnologyStageHandler
} from '../controllers/technologies.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all technologies
router.get('/', getAllTechnologiesHandler);

// Apply the verifyAdminToken middleware for all admin routes below this line
router.use(verifyToken);

// Get technologies count
router.get('/count', getTechnologiesCountHandler);

// Get technology by GeneratedID
router.get('/:generatedId', getTechnologyByGeneratedIDHandler);

// Get likes by technology GeneratedID
router.get('/:generatedId/likes', getLikesByTechnologyGeneratedIDHandler);

// Like technology by GeneratedID
router.post('/:generatedId/likes', likeTechnologyByGeneratedIDHandler);

// Get user like status by technology GeneratedID
router.get('/:generatedId/likes/status', getUserLikeStatusByTechnologyGeneratedIDHandler);

// Update technology stage
router.patch('/:generatedId/stage', updateTechnologyStageHandler);

// Get technologies by quadrant
router.get('/quadrant/:quadrantId', getTechnologiesByQuadrantHandler);

// Get technologies by ring
router.get('/ring/:ringId', getTechnologiesByRingHandler);

// Create new technology
router.post('/', createTechnologyHandler);

// Update technology
router.put('/:id', updateTechnologyHandler);

// Delete technology
router.delete('/:generatedId', deleteTechnologyHandler);

// Export for ES modules
export const technologiesRoutes = router;
export default router;