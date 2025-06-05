import { Schema, model } from 'mongoose';
import { ICabwire } from './cabwire.interface';

const CabwireSchema = new Schema<ICabwire>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    setAvailable: { type: Number, required: true },
    lastBookingTime: { type: Number, required: true },
    perKM: { type: Number, required: true },
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
  },
  {
    timestamps: true,
  }
);

export const CabwireModel = model<ICabwire>('Cabwire', CabwireSchema);
