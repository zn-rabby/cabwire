import { Document, Types } from 'mongoose';

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'continue'
  | 'clouse'
  | 'cancelled'
  | 'completed';

export type PaymentMethod = 'stripe' | 'offline';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface ILocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface IRide extends Document {
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;

  service: Types.ObjectId; // Reference to Service model
  category: Types.ObjectId; // Reference to Category model

  pickupLocation: ILocation;
  dropoffLocation: ILocation;

  distance?: number; // in km
  duration?: number; // in minutes
  fare?: number; // Optional: will be calculated based on distance & rate

  rideStatus: RideStatus;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  otp?: Number;
  paymentID?: string;
  orderId?: string;
  signature?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
