import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createBooking, getBookings } from '../controllers/bookingController.js';
const bookingRoute = Router();

bookingRoute
.post('/create-booking',authMiddleware,createBooking)
.get('/:userId/bookings',authMiddleware,getBookings)

export default bookingRoute;