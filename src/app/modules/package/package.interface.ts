import { Document, Types } from 'mongoose';

export type RideStatus = 'requested' | 'accepted' | 'delivered';

export type PaymentMethod = 'stripe' | 'offline';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface ILocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface IPackage extends Document {
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;

  myPay: Types.ObjectId; // ✅ Who is actually paying
  reciverPay: Types.ObjectId;

  pickupLocation: ILocation;
  dropoffLocation: ILocation;

  distance?: number;
  duration?: number;
  fare?: number;

  rideStatus: RideStatus;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  otp?: string;
  paymentID?: string;
  orderId?: string;

  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
}
