import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createPolicy, getPolicies } from '../controllers/policyController.js';
const policyRoute = Router();

policyRoute.post('/create-policy', authMiddleware,createPolicy)
.get('/policies', authMiddleware,getPolicies)

export default policyRoute;