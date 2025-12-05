import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";

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

export const cancelBooking = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await db.booking.findUnique({ where: { id } });

    if (!booking) return next(new ErrorHandler("Booking not found", 404));

    if (booking.booking_status === "Cancelled") {
      return next(new ErrorHandler("Booking already cancelled", 400));
    }

    const updated = await db.booking.update({
      where: { id },
      data: { booking_status: "Cancelled" }
    });

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: updated
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});


export const createBooking = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user.id; // from auth middleware
    const {
      car_id,
      driver_id,
      from_location,
      to_location,
      distance_km,
      total_price,
      travel_date,
      travel_time,
      trip_type,
      payment_method,
      passengers
    } = req.body;
console.log("I am here", req.body)
  //  console.log({
  //       user_id: userId,
  //       car_id,
  //       driver_id: driver_id || undefined,
  //       from_location,
  //       to_location,
  //       distance_km,
  //       total_price,
  //       // travel_date: new Date(travel_date).toISOString(),
  //       // travel_time,
  //       trip_type,
  //       passengers,
  //       payment_method,
  //       payment_status: "Pending",
  //       booking_status: "Booked"
  //     })

      return
    const booking = await db.booking.create({
      data: {
        user_id: userId,
        car_id,
        driver_id: driver_id || undefined,
        from_location,
        to_location,
        distance_km,
        total_price,
        travel_date: new Date(travel_date).toISOString(),
        // travel_time,
        trip_type,
        passengers,
        payment_method,
        payment_status: "Pending",
        booking_status: "Booked"
      }
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});


export const getAllBookings = CatchAsyncError(async (req, res, next) => {
  try {
    const bookings = await db.booking.findMany({
      include: {
        car: true,
        driver: true,
        auth: true,
        transaction: true
      }
    });

    res.json({ success: true, bookings });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});


export const getBookingById = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        car: true,
        driver: true,
        auth: true,
        transaction: true
      }
    });

    if (!booking) return next(new ErrorHandler("Booking not found", 404));

    res.json({ success: true, booking });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});





