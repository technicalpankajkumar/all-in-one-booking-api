import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";


export const createDriver = CatchAsyncError( async (req, res) => {
  try {
    const { driver_name, phone, license_number, address, rating, assigned_car_id } = req.body;
    const driver = await db.driver.create({
      data: {
        driver_name,
        phone,
        license_number,
        address,
        rating: rating ? Number.parseFloat(rating) : undefined,
        assigned_car_id: assigned_car_id || null
      }
    });

    res.status(200).json({ success: true, driver });
  } catch (err) {
     next(new ErrorHandler(err.message, 500))
  }
});


export const getDriver = CatchAsyncError( async (req, res) => {
  try {
    const drivers = await db.driver.findMany({ include: { Car: true } });
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    next(new ErrorHandler(err.message, 500))
  }
});
