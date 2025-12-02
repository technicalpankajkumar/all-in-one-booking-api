import { db } from "../config/db.js";
import { CatchAsyncError } from "../utils/catchAsyncError.js";


export const createTransaction = CatchAsyncError( async (req, res) => {
  /*
    Expected body: { booking_id, amount, status, payment_gateway }
  */
  try {
    const { booking_id, amount, status, payment_gateway } = req.body;
    if (!booking_id || !amount) return res.status(400).json({ error: 'Missing booking_id or amount' });

    // ensure booking exists
    const booking = await db.booking.findUnique({ where: { id: booking_id }});
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // create transaction and mark booking payment_status
    const tx = await db.transaction.create({
      data: {
        booking_id,
        amount: parseFloat(amount),
        status: status || 'pending',
        payment_gateway
      }
    });

    // update booking payment_status based on tx status
    const newStatus = (status && status.toLowerCase() === 'success') ? 'Paid' : 'Pending';
    await db.booking.update({
      where: { id: booking_id },
      data: { payment_status: newStatus }
    });

    res.json({ success: true, tx });
  } catch (err) {
    console.error('POST /transactions', err);
    res.status(500).json({ error: err.message });
  }
});
