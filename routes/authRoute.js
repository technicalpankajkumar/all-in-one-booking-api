import { Router } from 'express';
import { register, login, activateUser, forgetPassword, changePassword } from '../controllers/authController.js';
import { changePasswordValidation, loginValidation, registerValidation } from '../utils/validation.js';
import { validationMiddlewre } from '../middlewares/validationMiddleware.js';
import { checkValidAuth } from '../middlewares/validateAuthMiddleware.js';
const authRoute = Router();


authRoute.post('/register',registerValidation,validationMiddlewre, register)
.post('/login',loginValidation,validationMiddlewre, login)
.post('/activate-account', activateUser)
.post('/change-password',checkValidAuth , changePassword)
.post('/forget-password', checkValidAuth , forgetPassword)

export default authRoute;