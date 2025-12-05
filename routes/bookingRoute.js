import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { cancelBooking, createBooking, getAllBookings, getBookingById } from '../controllers/bookingController.js';
const bookingRoute = Router();

bookingRoute
.post("/create", authMiddleware, createBooking)
.get("/", authMiddleware, getAllBookings)
.get("/:id", authMiddleware, getBookingById)
.put("/:id/cancel", authMiddleware, cancelBooking)

export default bookingRoute;