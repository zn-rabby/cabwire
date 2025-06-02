import { Schema, model } from 'mongoose';
import { IRideBooking } from './booking.interface';

const rideBookingSchema = new Schema<IRideBooking>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },

    fare: { type: Number },

    startTime: Date,
    endTime: Date,

    otp: { type: String, select: false },

    rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
  },
  { timestamps: true }
);

export const RideBooking = model<IRideBooking>(
  'RideBooking',
  rideBookingSchema
);
