import { Router } from 'express';
import { updateProfile , createProfile} from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const userRoute = Router();

userRoute.post('/profile', authMiddleware, createProfile);
userRoute.put('/profile', authMiddleware, updateProfile);

export default userRoute;