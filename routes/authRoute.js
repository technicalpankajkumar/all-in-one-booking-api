import { Router } from 'express';
import { register, login, activateUser, forgetPassword, changePassword, changeAuthRequest, updateAuthInfo, logout, reGenerateToken } from '../controllers/authController.js';
import { changeAuthRequestValidation, changePasswordValidation, forgetPasswordValidation, loginValidation, reGenerateTokenValidation, registerValidation, updateAuthInfoValidation } from '../utils/validation.js';
import { validationMiddlewre } from '../middlewares/validationMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
const authRoute = Router();


authRoute.post('/register',registerValidation,validationMiddlewre, register)
.post('/login',loginValidation,validationMiddlewre, login)
.post('/logout',authMiddleware, logout)
.post('/activate-account', activateUser)
.put('/forget-password', forgetPasswordValidation,validationMiddlewre,forgetPassword)
.put('/change-password',changePasswordValidation, validationMiddlewre,authMiddleware , changePassword)
.put('/request-change-auth', changeAuthRequestValidation, validationMiddlewre, authMiddleware,changeAuthRequest)
.put('/update-auth', updateAuthInfoValidation, validationMiddlewre, authMiddleware,updateAuthInfo)
.put('/re-generate-token',reGenerateTokenValidation,validationMiddlewre, reGenerateToken)

export default authRoute;