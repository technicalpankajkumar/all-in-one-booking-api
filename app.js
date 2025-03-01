import express, { json } from 'express';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import resumeRoute from './routes/resumeRoute.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
export const app = express();

//body parser
app.use(json({limit:'50mb'}));
//cookie parser
app.use(cookieParser());

//cors => cross origin resource sharing
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials:true,
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/resume', resumeRoute);


// unknown route
app.all("*",(req,res,next)=>{
    const err = new Error(` Route ${req.originalUrl} not found !`);
    err.statusCode = 404;
    next(err)
});

app.use(errorMiddleware)