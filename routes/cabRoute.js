import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createCab, deleteCabById, getCabById, getCabs, updateCabById, UploadCabImage } from '../controllers/cabController.js';
import { uploadFile } from '../utils/multer.js';
const cabRoute = Router();

cabRoute.post('/add-cab', authMiddleware,createCab)
.put('/:cabId', authMiddleware,updateCabById)
.post('/:carId/images', authMiddleware,uploadFile.array('images', 6),UploadCabImage)
.get('/cabs', authMiddleware,getCabs)
.get('/:cabId', authMiddleware,getCabById)
.delete('/:cabId', authMiddleware,deleteCabById)
.put('/edit-cab', authMiddleware)

export default cabRoute;