import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createDriver, deleteDriverImage, getDriver, getDriverById, updateDriver } from '../controllers/driverController.js';
import { uploadDriver } from '../utils/multer.js';
const driverRoute = Router();

driverRoute
    .get('/', authMiddleware, getDriver)
    .post('/create', authMiddleware, uploadDriver.fields([
        { name: "profile", maxCount: 1 },
        { name: "aadhar_front", maxCount: 1 },
        { name: "aadhar_back", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "license_front", maxCount: 1 },
        { name: "license_back", maxCount: 1 },
        { name: "health_insurance", maxCount: 1 },
        { name: "term_insurance", maxCount: 1 }
    ]), createDriver)
    .put("/:driverId",
        uploadDriver.fields([
            { name: "profile", maxCount: 1 },
            { name: "aadhar_front", maxCount: 1 },
            { name: "aadhar_back", maxCount: 1 },
            { name: "pan", maxCount: 1 },
            { name: "driving_license_front", maxCount: 1 },
            { name: "driving_license_back", maxCount: 1 },
            { name: "health_insurance", maxCount: 1 },
            { name: "term_insurance", maxCount: 1 }
        ]),
        updateDriver)
    .get("/:id", getDriverById)
    .delete("/:imageId", deleteDriverImage)

export default driverRoute;