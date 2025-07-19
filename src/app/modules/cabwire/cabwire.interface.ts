import { Document, ObjectId, Types } from 'mongoose';

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
  userId?: Types.ObjectId; // from ride booking

  // Ride details
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  distance?: number;
  duration?: number;
  fare?: number;
  perKM: number;

  // Time
  startTime?: Date;
  endTime?: Date;
  lastBookingTime?: number;

  // Seats
  seatsBooked?: number;

  // OTP
  otp?: string;

  // Ride + Payment Status
  rideStatus: RideStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Availability
  setAvailable: number;
  users?: [
    {
      userId: ObjectId;
      seats: number;
      otp: string;
      isVerified: boolean;
      bookingId: ObjectId; // optional: for reverse lookup
    }
  ];
}
