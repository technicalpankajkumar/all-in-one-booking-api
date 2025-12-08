import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";

export const getDashboardData = CatchAsyncError(async (req, res, next) => {
  try {
    const { status } = req.query; 
    // status filter: inprogress, cancelled, complete, booked

    // ----------- TOTAL COUNTS -----------
    const [totalBookings, totalCars, totalDrivers, totalUsers] = await Promise.all([
      db.booking.count(),
      db.car.count(),
      db.driver.count(),
      db.auth.count(),
    ]);

    // ----------- RECENT BOOKINGS WITH FILTER -----------
    let filter = {};
    if (status) {
      filter.status = status; // only if query exists
    }

    const recentBookingList = await db.booking.findMany({
      where: filter,
      orderBy: { created_at: "desc" },
      take: 20,
      include: {
        user: true,
        car: true,
        driver: true,
      },
    });

    return res.json({
      success: true,
      data: {
        totalBookings,
        totalCars,
        totalDrivers,
        totalUsers,
        recentBookingList,
      }
    });

  } catch (error) {
     return next(new ErrorHandler(err.message, 500));
  }
});