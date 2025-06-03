import { Schema, model } from 'mongoose'; 
import { IRide } from './cabwire.interface';

const RideSchema = new Schema<IRide>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming driver is stored in 'User' collection
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
      enum: ['requested', 'accepted', 'ongoing', 'completed', 'cancelled'],
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
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export const RideModel = model<IRide>('Ride', RideSchema);
