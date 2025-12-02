import express, { json } from 'express';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';

import { errorMiddleware } from './middlewares/errorMiddleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import cabRoute from './routes/cabRoute.js';
import driverRoute from './routes/driverRoute.js';
import policyRoute from './routes/policyRoute.js';
import bookingRoute from './routes/bookingRoute.js';
import transactionRoute from './routes/transactionRoute.js';
export const app = express();

//body parser
app.use(json({limit:'50mb'}));

//cookie parser
app.use(cookieParser());

// CORS configuration to allow all origins
const corsOptions = {
    origin: 'http://localhost:8080', // Allow all origins or specify your allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true // Allow credentials if needed
  };
  
app.use(cors(corsOptions));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/cab', cabRoute);
app.use('/api/v1/driver', driverRoute);
app.use('/api/v1/policy', policyRoute);
app.use('/api/v1/booking', bookingRoute);
app.use('/api/v1/transaction', transactionRoute);

// Sample route
app.get('/api/v1', (req, res) => {
    res.status(200).send({ message: 'Welcome to the IWT API!' });
});

// unknown route
app.all("*",(req,res,next)=>{
    const err = new Error(` Route ${req.originalUrl} not found !`);
    err.statusCode = 404;
    next(err)
});

app.use(errorMiddleware)