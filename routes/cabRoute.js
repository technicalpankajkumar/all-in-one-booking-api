import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createCab, createCarFeatures, deleteCabById, getCabById, getCabs, getCarFeatures, updateCabById } from '../controllers/cabController.js';
import { uploadFile } from '../utils/multer.js';
const cabRoute = Router();

cabRoute.post('/', authMiddleware,uploadFile.array('images', 6),createCab)
.post('/feature',authMiddleware,createCarFeatures)
.get('/feature',authMiddleware,getCarFeatures)
.get('/',getCabs)
.put('/:cabId', authMiddleware,uploadFile.array('images', 6),updateCabById)
.get('/:cabId', authMiddleware,getCabById)
.delete('/:cabId', authMiddleware,deleteCabById)

export default cabRoute;