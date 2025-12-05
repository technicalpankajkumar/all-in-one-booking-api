import { Router } from 'express';
import { createPayment, getPayment } from '../controllers/transactionContnroller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
const transactionRoute = Router();

transactionRoute
.post("/create/:bookingId", authMiddleware, createPayment)
.get("/get/:bookingId", authMiddleware, getPayment);

export default transactionRoute;