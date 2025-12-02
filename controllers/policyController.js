import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";


export const createPolicy= CatchAsyncError( async (req, res) => {
  try {
    const { title, description, car_type, min_booking_km, cancellation_rules, terms_conditions } = req.body;
    const policy = await db.policy.create({
      data: { title, description, car_type, min_booking_km: min_booking_km ? Number(min_booking_km) : 0, cancellation_rules, terms_conditions }
    });
    res.json({ success: true, policy });
  } catch (err) {
    console.error('POST /policies', err);
    res.status(500).json({ error: err.message });
  }
});

export const getPolicies= CatchAsyncError( async (req, res) => {
  try {
    const policies = await db.policy.findMany();
    res.json({ success: true, policies });
  } catch (err) {
    console.error('GET /policies', err);
    res.status(500).json({ error: err.message });
  }
});
