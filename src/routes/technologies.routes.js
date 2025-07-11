import express from 'express';

import { 
    getAllTechnologiesHandler, 
    getTechnologyByIdHandler, 
    getTechnologyByLabelHandler, 
    getTechnologiesCountHandler,
    createTechnologyHandler, 
    updateTechnologyHandler, 
    deleteTechnologyHandler,
    getTechnologiesByQuadrantHandler,
    getTechnologiesByRingHandler,
    getUserLikeStatusByTechnologyLabelHandler,
    getLikesByTechnologyLabelHandler,
    likeTechnologyByLabelHandler,
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

// Get technology by ID
router.get('/:label', getTechnologyByLabelHandler);

// Get likes by technology label
router.get('/:label/likes', getLikesByTechnologyLabelHandler);

// Like technology by label
router.post('/:label/likes', likeTechnologyByLabelHandler);

// Get user like status by technology label
router.get('/:label/likes/status', getUserLikeStatusByTechnologyLabelHandler);

// Update technology stage
router.patch('/:label/stage', updateTechnologyStageHandler);

// Get technologies by quadrant
router.get('/quadrant/:quadrantId', getTechnologiesByQuadrantHandler);

// Get technologies by ring
router.get('/ring/:ringId', getTechnologiesByRingHandler);

// Create new technology
router.post('/', createTechnologyHandler);

// Update technology
router.put('/:id', updateTechnologyHandler);

// Delete technology
router.delete('/:id', deleteTechnologyHandler);

// Export for ES modules
export const technologiesRoutes = router;
export default router;