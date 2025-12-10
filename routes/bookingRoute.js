import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { cancelBooking, createBooking, getAllBookings, getBookingById, realTimeFareCalculate } from '../controllers/bookingController.js';
const bookingRoute = Router();

bookingRoute
.post("/create", authMiddleware, createBooking)
.get("/", authMiddleware, getAllBookings)
.get("/:id", authMiddleware, getBookingById)
.put("/:id/cancel", authMiddleware, cancelBooking)
.get('/realtime-fare-calculation',realTimeFareCalculate)

export default bookingRoute;