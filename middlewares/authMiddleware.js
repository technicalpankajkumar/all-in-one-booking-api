import jwt from 'jsonwebtoken';
import { CatchAsyncError } from '../utils/catchAsyncError.js';

export const  authMiddleware = CatchAsyncError(async (req, res, next)=>{
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).send({ error: 'Access denied' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  })

export default authMiddleware;