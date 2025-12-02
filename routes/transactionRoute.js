import { Router } from 'express';
import { createTransaction } from '../controllers/transactionContnroller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
const transactionRoute = Router();

transactionRoute.post('/create-transaction', authMiddleware,createTransaction)

export default transactionRoute;