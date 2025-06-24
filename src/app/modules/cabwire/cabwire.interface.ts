import { Document, Types } from 'mongoose';

export type RideStatus =
  | 'requested'
  | 'book'
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

export interface ICabwire extends Document {
  driverId: Types.ObjectId;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  distance?: number;
  duration?: number;
  fare?: number;
  otp?: string;

  rideStatus: RideStatus;
  setAvailable: number;
  lastBookingTime: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  perKM: number;
}
