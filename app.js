import express, { json } from 'express';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';

import { errorMiddleware } from './middlewares/errorMiddleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
export const app = express();

//body parser
app.use(json({limit:'50mb'}));

//cookie parser
app.use(cookieParser());

// CORS configuration to allow all origins
const corsOptions = {
    origin: 'http://localhost:8080', // Allow all origins or specify your allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Content-Type'],
    credentials: true // Allow credentials if needed
  };
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);

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