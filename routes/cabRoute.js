import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createCab, createCarFeatures, deleteCabById, getCabById, getCabs, updateCabById } from '../controllers/cabController.js';
import { uploadFile } from '../utils/multer.js';
const cabRoute = Router();

cabRoute.post('/create', authMiddleware,uploadFile.array('images', 6),createCab)
.put('/:cabId', authMiddleware,uploadFile.array('images', 6),updateCabById)
.get('/',getCabs)
.get('/:cabId', authMiddleware,getCabById)
.delete('/:cabId', authMiddleware,deleteCabById)
.put('/edit', authMiddleware)
.post('/feature/create',authMiddleware,createCarFeatures)

export default cabRoute;