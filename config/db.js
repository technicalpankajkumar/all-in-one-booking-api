import mongoDB from 'mongoose';
import { config } from 'dotenv';

config();

export const connectMongoDB = async () => {
    try {
        await mongoDB.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

