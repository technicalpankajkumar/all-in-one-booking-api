import { Router } from 'express';
import { register, login, activateUser } from '../controllers/authController.js';
import { registerValidation } from '../utils/validation.js';
import { validationMiddlewre } from '../middlewares/validationMiddleware.js';
const authRoute = Router();


authRoute.post('/register',registerValidation,validationMiddlewre, register)
.post('/login', login)
.post('/activate-account', activateUser);

export default authRoute;