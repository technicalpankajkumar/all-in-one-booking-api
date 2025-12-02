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
        rating: rating ? Number(rating) : undefined,
        assigned_car_id: assigned_car_id || null
      }
    });

    res.status(200).json({ success: true, driver });
  } catch (err) {
    console.error('POST /drivers', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});


export const getDriver = CatchAsyncError( async (req, res) => {
  try {
    const drivers = await db.driver.findMany({ include: { Car: true } });
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    console.error('GET /drivers', err);
    res.status(500).json({ error: 'Server error' });
  }
});
