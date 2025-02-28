import { Router } from 'express';
import { register, login, activateUser } from '../controllers/authController.js';
const authRoute = Router();


authRoute.post('/register', register)
.post('/login', login)
.post('/activate-account', activateUser);

export default authRoute;