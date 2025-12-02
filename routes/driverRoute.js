import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
const driverRoute = Router();

driverRoute.post('/add-cab', authMiddleware,createCab)
.put('/:cabId', authMiddleware,updateCabById)
.get('/cabs', authMiddleware,getCabs)
.get('/:cabId', authMiddleware,getCabById)
.delete('/:cabId', authMiddleware,deleteCabById)
.put('/edit-cab', authMiddleware)

export default driverRoute;