import jwt from 'jsonwebtoken'
import ErrorHandler from '../utils/errorHandler.js';
import { db } from '../config/db.js';
import { CatchAsyncError } from '../utils/catchAsyncError.js';

// Middleware to validate token and get user
export const authMiddleware = CatchAsyncError(async (req, res, next) => {
    const token = req.headers['authorization']; // Extract token from Authorization header

    if (!token) {
        return res.status(401).json({ error: 'Access Denied, Please Login First!' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key
        // Retrieve user from the database
        const user = await db.auth.findUnique({ where: { id: decoded.id } });
        
        if (!user) {
            return res.status(404).json({ error: 'User  not found' });
        }

        // Attach user to request object
        req.user = user;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return next(new ErrorHandler('Invalid token', 401));
    }
})