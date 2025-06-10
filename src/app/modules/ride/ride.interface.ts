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

  service: Types.ObjectId;  
  category: Types.ObjectId;  

  pickupLocation: ILocation;
  dropoffLocation: ILocation;

  distance?: number;  
  duration?: number;  
  fare?: number;  

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
