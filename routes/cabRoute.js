import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createCab, createCarFeatures, deleteCabById, getCabById, getCabs, getCarFeatures, updateCabById } from '../controllers/cabController.js';
import { uploadFile } from '../utils/multer.js';
const cabRoute = Router();

cabRoute.post('/create', authMiddleware,uploadFile.array('images', 6),createCab)
.put('/update/:cabId', authMiddleware,uploadFile.array('images', 6),updateCabById)
.get('/get',getCabs)
.get('/get/:cabId', authMiddleware,getCabById)
.delete('/delete/:cabId', authMiddleware,deleteCabById)
.post('/feature/create',authMiddleware,createCarFeatures)
.get('/feature/get',authMiddleware,getCarFeatures)

export default cabRoute;