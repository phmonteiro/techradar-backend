import express from 'express';
import { login, validateToken } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public authentication routes (no middleware required)
router.post('/login', login);

// Protected routes (JWT verification required)
router.get('/validate-token', verifyToken, validateToken);

export default router;
export { router as authRoutes }; 