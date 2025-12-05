import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";


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
      data: { 
        booking_status: "Cancelled" }
    });

    await db.car.update({
      where: { id: booking.car_id },
      data: {
      is_available: true
      }
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
      // return
      const car = await db.car.findUnique({
      where: { id: car_id },
      include: { drivers: true }
    });

    const booking = await db.booking.create({
      data: {
        user_id: userId,
        car_id,
        driver_id: driver_id || car?.drivers?.[0]?.id || null,
        from_location,
        to_location,
        distance_km,
        total_price,
        travel_date: new Date(travel_date).toISOString(),
        travel_time,
        trip_type,
        passengers,
        payment_method,
        payment_status: "Pending",
        booking_status: "Booked"
      }
    });
    await db.car.update({
      where: { id: car_id },
      data: {
      is_available: false
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
      where:{
        NOT:{
          booking_status: "Cancelled"
        }
      },
      include: {
        car: {
          include:{
            images:true
          }
        },
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





