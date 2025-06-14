import { Schema, model } from 'mongoose';
import { IRideBooking } from './booking.interface';
export const locationSchema = {
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String },
};

const rideBookingSchema = new Schema<IRideBooking>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Cabwire',
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
    },
    fare: {
      type: Number,
      required: false,
    },
    distance: { type: Number, required: false },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    otp: {
      type: String,
      select: false,
    },
    pickupLocation: locationSchema,
    dropoffLocation: locationSchema,
    paymentMethod: {
      type: String,
      enum: ['stripe', 'offline'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    rideStatus: {
      type: String,
      enum: [
        'requested',
        'accepted',
        'continue',
        'clouse',
        'cancelled',
        'completed',
      ],
      default: 'requested',
    },
  },
  {
    timestamps: true,
  }
);

export const RideBooking = model<IRideBooking>(
  'RideBooking',
  rideBookingSchema
);
