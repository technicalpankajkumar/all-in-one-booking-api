import express, { json } from 'express';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';

const app = express();
app.use(json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});