import { Schema, model } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // bookingId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'RideBooking',
    //   required: true,
    // },

    amount: { type: Number, required: true },

    method: {
      type: String,
      enum: ['stripe', 'offline'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    transactionId: String,
    orderId: String,
    signature: String,

    paidAt: Date,
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
