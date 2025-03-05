import jwt from 'jsonwebtoken'
import ErrorHandler from '../utils/errorHandler.js';
import { db } from '../config/db.js';
import { CatchAsyncError } from '../utils/catchAsyncError.js';
import { authService } from '../services/authService.js';

// Middleware to validate token and get user
export const authMiddleware = CatchAsyncError(async (req, res, next) => {

    try {
        const token = req.headers['authorization'] || req.cookies?.token; // Extract token from Authorization header
        if (!token) {
            return next(new ErrorHandler('Access Denied, Please Login First!',403))
        }
    
        const isBlacklisted = await authService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return next(new ErrorHandler('Token is blacklisted!',403))
        }
        // Verify the token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Use your secret key
        // Retrieve user from the database
        const user = await authService.findAuth({ where: { id: decoded.id } })
        
        if (!user) {
            return next(new ErrorHandler('User not found!',404))
        }

        // Attach user to request object
        req.user = user;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return next(new ErrorHandler('Invalid token', 401));
    }
})