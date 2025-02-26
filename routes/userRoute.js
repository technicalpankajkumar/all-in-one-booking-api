import { Router } from 'express';
import { updateProfile } from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const router = Router();

router.put('/profile', authMiddleware, updateProfile);

export default router;