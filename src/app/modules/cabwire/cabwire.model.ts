import { Schema, model } from 'mongoose';
import { ICabwire } from './cabwire.interface';

const CabwireSchema = new Schema<ICabwire>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    pickupLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String },
    },
    dropoffLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String },
    },
    distance: { type: Number },
    duration: { type: Number },
    fare: { type: Number },
    perKM: { type: Number, required: true },
    otp: {
      type: String,
      select: false,
    },
    rideStatus: {
      type: String,
      enum: [
        'requested',
        'book',
        'continue',
        'clouse',
        'cancelled',
        'completed',
      ],
      default: 'requested',
    },
    setAvailable: { type: Number, required: true },
    lastBookingTime: { type: Number, required: false },

    // New from booking
    startTime: { type: Date },
    endTime: { type: Date },
    seatsBooked: { type: Number },

    // Payment info
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
    users: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        seats: { type: Number, default: 1 },
        otp: { type: String },
        isVerified: { type: Boolean, default: true },
        bookingId: { type: Schema.Types.ObjectId, ref: 'RideBooking' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const CabwireModel = model<ICabwire>('Cabwire', CabwireSchema);
