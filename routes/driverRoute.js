import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createDriver, getDriver } from '../controllers/driverController.js';
const driverRoute = Router();

driverRoute
.get('/',authMiddleware,getDriver)
.post('/create-driver', authMiddleware,createDriver)

export default driverRoute;