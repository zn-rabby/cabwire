import { Document, Types } from 'mongoose';
import { RideStatus, PaymentMethod } from '../ride/ride.interface';
import { ILocation } from '../notification/notification.interface';

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export interface IRideBooking extends Document {
  rideId: Types.ObjectId;
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;

  seatsBooked: number;
  fare?: number;

  startTime?: Date;
  endTime?: Date;

  otp?: string;

  distance?: number;

  pickupLocation: ILocation;
  dropoffLocation: ILocation;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  rideStatus: RideStatus;
}
