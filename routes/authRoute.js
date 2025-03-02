import { Router } from 'express';
import { register, login, activateUser, forgetPassword, changePassword, changeAuthRequest, updateAuthInfo } from '../controllers/authController.js';
import { changeAuthRequestValidation, changePasswordValidation, forgetPasswordValidation, loginValidation, registerValidation, updateAuthInfoValidation } from '../utils/validation.js';
import { validationMiddlewre } from '../middlewares/validationMiddleware.js';
import { checkValidAuth } from '../middlewares/validateAuthMiddleware.js';
const authRoute = Router();


authRoute.post('/register',registerValidation,validationMiddlewre, register)
.post('/login',loginValidation,validationMiddlewre, login)
.post('/activate-account', activateUser)
.put('/change-password',changePasswordValidation, validationMiddlewre,checkValidAuth , changePassword)
.put('/forget-password', forgetPasswordValidation,validationMiddlewre,forgetPassword)
.put('/request-change-auth', changeAuthRequestValidation, validationMiddlewre, checkValidAuth,changeAuthRequest)
.put('/update-auth', updateAuthInfoValidation, validationMiddlewre, checkValidAuth,updateAuthInfo)

export default authRoute;