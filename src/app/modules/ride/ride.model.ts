import { Schema, model } from 'mongoose';
import { IRide } from './ride.interface';

export const locationSchema = {
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String },
};

const rideSchema = new Schema<IRide>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },

    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },

    pickupLocation: locationSchema,
    dropoffLocation: locationSchema,

    distance: { type: Number },
    duration: { type: Number },

    // ✅ Add these for review rating logic
    rating: { type: Number },
    totalRating: { type: Number },

    fare: { type: Number }, // Optional fare calculated based on distance & category

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
    rideType: {
      type: String,
      enum: ['Car', 'EmergencyCar', 'RentalCar'],
      default: 'Car',
    },

    otp: { type: Number, select: false },
    paymentID: String,
    orderId: String,
    signature: String,
  },
  {
    timestamps: true,
  }
);

export const Ride = model<IRide>('Ride', rideSchema);
