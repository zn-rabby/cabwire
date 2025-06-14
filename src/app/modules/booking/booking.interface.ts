import { Document, Types } from 'mongoose';
import {
  RideStatus,
  PaymentMethod,
  PaymentStatus,
} from '../ride/ride.interface';

export interface IRideBooking extends Document {
  rideId: Types.ObjectId;
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;

  seatsBooked: number;
  fare: number;

  startTime?: Date;
  endTime?: Date;

  otp?: string;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  rideStatus: RideStatus;
}
