import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createDriver, deleteDriver, getDriver, getDriverById, updateDriver } from '../controllers/driverController.js';
import { uploadDriver } from '../utils/multer.js';
const driverRoute = Router();

driverRoute
    .get('/', authMiddleware, getDriver)
    .post('/', authMiddleware, uploadDriver.fields([
            { name: "profile", maxCount: 1 },
            { name: "signature", maxCount: 1 },
            { name: "aadhar", maxCount: 1 },
            { name: "pan", maxCount: 1 },
            { name: "driving_license", maxCount: 1 },
            { name: "health_insurance", maxCount: 1 },
            { name: "term_insurance", maxCount: 1 }
        ]), createDriver)
    .put("/:driverId",
        uploadDriver.fields([
            { name: "profile", maxCount: 1 },
            { name: "signature", maxCount: 1 },
            { name: "aadhar", maxCount: 1 },
            { name: "pan", maxCount: 1 },
            { name: "driving_license", maxCount: 1 },
            { name: "health_insurance", maxCount: 1 },
            { name: "term_insurance", maxCount: 1 }
        ]),
        updateDriver)
    .get("/:id",authMiddleware, getDriverById)
    .delete("/:id",authMiddleware,deleteDriver)

export default driverRoute;