import { Router } from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import { createCab, deleteCabById, getCabById, getCabs, updateCabById } from '../controllers/cabController.js';
import { uploadFile } from '../utils/multer.js';
const cabRoute = Router();

cabRoute.post('/create', authMiddleware,uploadFile.array('images', 6),createCab)
.put('/:cabId', authMiddleware,uploadFile.array('images', 6),updateCabById)
.get('/',getCabs)
.get('/:cabId', authMiddleware,getCabById)
.delete('/:cabId', authMiddleware,deleteCabById)
.put('/edit', authMiddleware)

export default cabRoute;