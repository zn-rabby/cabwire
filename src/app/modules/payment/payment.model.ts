import { Schema, model } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

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

    transactionId: { type: String },
    orderId: { type: String },
    signature: { type: String },

    paidAt: { type: Date },

    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    driverAmount: { type: Number, required: true },
    adminAmount: { type: Number, required: true },
    availableAmount: { type: Number, required: false },
    totalWithdorwAmount: { type: Number, required: false },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
