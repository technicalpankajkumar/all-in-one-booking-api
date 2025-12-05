import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";


export const createPayment = CatchAsyncError(async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { amount, status, payment_gateway } = req.body;

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return next(new ErrorHandler("Booking not found", 404));

    const transaction = await db.transaction.create({
      data: {
        booking_id: bookingId,
        amount,
        status,
        payment_gateway
      }
    });

    await db.booking.update({
      where: { id: bookingId },
      data: {
        payment_status: status === "success" ? "Paid" : "Pending"
      }
    });

    res.json({
      success: true,
      message: "Payment recorded successfully",
      transaction
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

export const getPayment = CatchAsyncError(async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const transaction = await db.transaction.findUnique({
      where: { booking_id: bookingId }
    });

    res.json({
      success: true,
      transaction
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

