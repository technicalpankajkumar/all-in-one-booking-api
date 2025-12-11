import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { updateBookingStatus, createBooking, getAllBookings, getBookingById, realTimeFareCalculate } from '../controllers/bookingController.js';
const bookingRoute = Router();

bookingRoute
.post("/create", authMiddleware, createBooking)
.get("/", authMiddleware, getAllBookings)
.get("/:id", authMiddleware, getBookingById)
.put("/:id/status", authMiddleware, updateBookingStatus)
.get('/realtime-fare-calculation',realTimeFareCalculate)

export default bookingRoute;