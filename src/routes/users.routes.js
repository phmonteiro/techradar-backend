import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/users.controller.js';

const router = express.Router();

// User management routes
router.get('/', verifyToken, requireAdmin, getAllUsers); // Admin-only: Get all users
router.get('/:id', verifyToken, getUserById); // Any authenticated user: Get user by ID
router.post('/', verifyToken, requireAdmin, createUser); // Admin-only: Create a new user
router.put('/:id', verifyToken, requireAdmin, updateUser); // Admin-only: Update a user
router.delete('/:id', verifyToken, requireAdmin, deleteUser); // Admin-only: Delete a user

export default router;
export { router as usersRoutes };