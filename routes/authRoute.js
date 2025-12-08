import { Router } from 'express';
import { register, login, activateUser, forgetPassword, changePassword, changeAuthRequest, logout, reGenerateToken, adminUpdateAnyUser, updateMyAuthAndProfile, getAuth } from '../controllers/authController.js';
import { changeAuthRequestValidation, changePasswordValidation, forgetPasswordValidation, loginValidation, reGenerateTokenValidation, registerValidation } from '../utils/validation.js';
import { validationMiddlewre } from '../middlewares/validationMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const authRoute = Router();


authRoute.post('/register',registerValidation,validationMiddlewre, register)
.post('/activate-account', activateUser)
.post('/login',loginValidation,validationMiddlewre, login)
.post('/logout',authMiddleware, logout)
.put('/change-password',changePasswordValidation, validationMiddlewre,authMiddleware , changePassword)
.put('/forget-password', forgetPasswordValidation,validationMiddlewre,forgetPassword)
.put('/request-change-auth', changeAuthRequestValidation, validationMiddlewre, authMiddleware,changeAuthRequest)
.put('/re-generate-token',reGenerateTokenValidation,validationMiddlewre, reGenerateToken)
.put('/update-auth-profile',authMiddleware,updateMyAuthAndProfile)
.put('/update-user/:authId',authMiddleware,authorizeRoles("ADMIN", "MASTER"),adminUpdateAnyUser)
.get('/get-auth',authMiddleware,authorizeRoles("ADMIN", "MASTER"),getAuth)

export default authRoute;