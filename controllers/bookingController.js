import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";


// price calculation helper
function calculatePrice({ distance_km, car, extraKmCharge, included_km, days }) {
  // car.price_unit can be: per_km, per_trip, per_day
  if (car.price_unit === 'per_km') {
    return car.base_price * distance_km;
  }
  if (car.price_unit === 'per_day') {
    const d = days ? Math.max(1, Math.floor(days)) : 1;
    return car.base_price * d;
  }
  // per_trip by default: base_price includes some included_km optional
  const included = included_km ? Number(included_km) : 0;
  if (included && distance_km > included) {
    const extra = distance_km - included;
    const extraCharge = extraKmCharge ? Number(extraKmCharge) : 0;
    return Number(car.base_price) + extra * extraCharge;
  }
  // fallback
  return Number(car.base_price);
}

export const createBooking= CatchAsyncError( async (req, res) => {
      /*
  Expected body:
  {
    user_id, car_id, from_location, to_location,
    distance_km, travel_date, payment_method,
    driver_id (optional),
    extraKmCharge (optional), included_km (optional), days (optional)
  }
  */
  try {
    const {
      user_id, car_id, from_location, to_location,
      distance_km, travel_date, payment_method, driver_id,
      extraKmCharge, included_km, days
    } = req.body;

    if (!user_id || !car_id || !from_location || !to_location || distance_km === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // fetch car
    const car = await db.car.findUnique({ where: { id: car_id }});
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const total_price = calculatePrice({
      distance_km: parseFloat(distance_km),
      car,
      extraKmCharge,
      included_km,
      days
    });

    const booking = await db.booking.create({
      data: {
        user_id,
        car_id,
        driver_id: driver_id || null,
        from_location,
        to_location,
        distance_km: parseFloat(distance_km),
        total_price: parseFloat(total_price),
        travel_date: new Date(travel_date),
        payment_method,
        payment_status: 'Pending',
        booking_status: 'Confirmed'
      }
    });

    res.json({ success: true, booking });
  } catch (err) {
    console.error('POST /bookings', err);
    res.status(500).json({ error: err.message });
  }
});

// Get bookings for user
export const getBookings= CatchAsyncError( async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await prisma.booking.findMany({
      where: { user_id: userId },
      include: { car: true, driver: true, transaction: true }
    });
    res.json({ success: true, bookings });
  } catch (err) {
    console.error('GET /users/:userId/bookings', err);
    res.status(500).json({ error: err.message });
  }
});