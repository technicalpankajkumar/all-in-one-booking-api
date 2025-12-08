import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { getDashboardData } from '../controllers/dashboardController.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const dashboardRoute = Router();

dashboardRoute.get('/', authMiddleware,authorizeRoles("ADMIN","MASTER"),getDashboardData)

export default dashboardRoute;