import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { calculateFinalFare, formatTravelTime } from "../utils/helper.js";


export const updateBookingStatus = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_status } = req.body;
    const role = req.user.role;        // "user", "driver", "admin", "master"
    const userId = req.user.id;

    // 1️⃣ Fetch booking with required details
    const booking = await db.booking.findUnique({
      where: { id },
      include: { car: true }
    });

    if (!booking) {
      return next(new ErrorHandler("Booking not found", 404));
    }

    const current = booking.booking_status;

    // 2️⃣ Validate new status value
    const validStatuses = ["Booked", "Confirmed", "Cancelled", "Completed"];

    if (!validStatuses.includes(new_status)) {
      return next(new ErrorHandler("Invalid booking status.", 400));
    }

    // 3️⃣ USER role restrictions
    if (role === "user") {
      if (booking.user_id !== userId) {
        return next(new ErrorHandler("You cannot update someone else’s booking.", 403));
      }

      // User can only cancel
      if (new_status !== "Cancelled") {
        return next(new ErrorHandler("Users can only cancel a booking.", 403));
      }

      // Cannot cancel completed
      if (current === "Completed") {
        return next(new ErrorHandler("Completed booking cannot be cancelled.", 400));
      }
    }

    // 4️⃣ Prevent invalid transitions
    if (current === "Completed") {
      return next(new ErrorHandler("Completed booking cannot be updated.", 400));
    }

    if (current === "Cancelled") {
      return next(new ErrorHandler("Cancelled booking cannot be updated.", 400));
    }

    // Only admin/driver/master can Confirm or Complete
    if (["Confirmed", "Completed"].includes(new_status)) {
      if (!["admin", "master", "driver"].includes(role)) {
        return next(new ErrorHandler("You are not allowed to update to this status.", 403));
      }
    }

    // 5️⃣ Update status in DB
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        booking_status: new_status,
        ...(new_status === "Cancelled" && { cancelled_at: new Date() }),
        ...(new_status === "Completed" && { completed_at: new Date() })
      }
    });

    // 6️⃣ Car availability logic
    if (new_status === "Cancelled" || new_status === "Completed") {
      await db.car.update({
        where: { id: booking.car_id },
        data: { is_available: true }
      });
    }

    if (new_status === "Confirmed") {
      await db.car.update({
        where: { id: booking.car_id },
        data: { is_available: false }
      });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${new_status}.`,
      booking: updatedBooking
    });

  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

export const createBooking = CatchAsyncError(async (req, res, next) => {
  try {
    const { data } = req.body;
    const userId = req.user.id; // from auth middleware
    const newData = typeof data === "object" ? data : JSON.parse(data);

     const {
      driver_id,
      car_id,
      from_location,
      to_location,
      distance_km,
      waiting_min = 0,
      driver_late_min = 0,
      pickup_time,
      travel_date,
      trip_type,
      payment_method,
      passengers,
      fare_result,
    } = newData;


    const booking = await db.booking.create({
      data: {
        user_id: userId,
        car_id,
        driver_id: driver_id || null,
        from_location,
        to_location,
        distance_km,
        duration_min,
        waiting_min,
        driver_late_min,
        pickup_time,
        is_night_ride: fare_result.isNightRide,
        final_fare: fare_result.finalFare,
        travel_date: new Date(travel_date).toISOString(),
        trip_type,
        passengers: passengers || [],
        payment_method,
        payment_status: "Pending",
        booking_status: "Booked",
        travel_time: formatTravelTime(duration_min), // "3 hr 25 min"
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
      booking,
      fare_breakdown: fare_result.breakdown,
      final_fare: fare_result.finalFare,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

export const getAllBookings = CatchAsyncError(async (req, res, next) => {
  try {
    const {
      search = "",
      status,
      sortBy = "created_at",
      sortOrder = "desc",
      page = 1,
      limit = 20,
      driver_id,
      user_id,
      car_id
    } = req.query;

    const role = req.user.role;   // "admin", "driver", "user", "master"
    const loggedUserId = req.user.id;

    // PAGINATION
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    // BASE FILTER
    let filters = {
      booking_status: status ? status : undefined,
      NOT: { booking_status: "Cancelled" }
    };

    // ROLE BASED FILTERS
    if (role === "driver") {
      filters.driver_id = loggedUserId;
    }

    if (role === "user") {
      filters.user_id = loggedUserId;
    }

    // MASTER & ADMIN → NO restrictions (full access)

    // OPTIONAL FILTERS (admin can filter by driver / user / car)
    if (driver_id) filters.driver_id = driver_id;
    if (user_id) filters.user_id = user_id;
    if (car_id) filters.car_id = car_id;

    // 🔍 SEARCH filter
    if (search.trim() !== "") {
      filters.OR = [
        { from_location: { contains: search, mode: "insensitive" } },
        { to_location: { contains: search, mode: "insensitive" } },
        { auth: { name: { contains: search, mode: "insensitive" } } },
        { driver: { name: { contains: search, mode: "insensitive" } } },
        { car: { car_name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // SORTING
    const orderBy = {};
    orderBy[sortBy] = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

    // FETCH DATA
    const bookings = await db.booking.findMany({
      where: filters,
      include: {
        car: { include: { images: true } },
        driver: true,
        auth: true,
        transaction: true
      },
      orderBy,
      take,
      skip
    });

    // COUNT FOR PAGINATION
    const total = await db.booking.count({ where: filters });

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      bookings
    });

  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});


export const getBookingById = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user.role;   // "admin" | "driver" | "user" | "master"
    const loggedUserId = req.user.id;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        car: { include: { images: true, fare_rules: true } },
        driver: true,
        auth: true,              // user details
        transaction: true
      }
    });

    if (!booking) {
      return next(new ErrorHandler("Booking not found", 404));
    }

    // 🔐 ROLE RESTRICTIONS
    if (role === "user" && booking.user_id !== loggedUserId) {
      return next(new ErrorHandler("You are not allowed to access this booking", 403));
    }

    if (role === "driver" && booking.driver_id !== loggedUserId) {
      return next(new ErrorHandler("This booking is not assigned to you", 403));
    }

    // Admin, Master → Full access, no restrictions
    // (role === "admin" || role === "master")

    return res.json({
      success: true,
      booking
    });

  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});


export const realTimeFareCalculate = CatchAsyncError(async (req,res,next) => {
  try{
     
    const {distance_km,waiting_min =0,driver_late_min=0,pickup_time} = req.body;
    
    // Auto calculate duration based on speed 70 km/hr
    const duration_min = Number.parseFloat(distance_km) / (70 / 60);

    // 1️⃣ Fetch Fare Rules for the car
    const rule = await prisma.carFareRule.findUnique({
      where: { car_id },
    });

    if (!rule) {
      return res.status(404).json({ message: "Fare rule not found" });
    }

    // 2️⃣ Calculate Final Fare
    const fareResult = calculateFinalFare(rule, {
      distanceKm: Number(distance_km),
      durationMin: duration_min,
      waitingMin:  Number(waiting_min) || 0,
      driverLateMin: Number(driver_late_min) || 0,
      pickupTime: pickup_time,
    });
    return res.json({
      success: true,
      fare_result: fareResult
    });
  }catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
})






