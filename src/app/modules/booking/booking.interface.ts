import { Document, Types } from 'mongoose';
import { RideStatus } from '../ride/ride.interface';

export interface IRideBooking extends Document { 
  driverId?: Types.ObjectId;

  fare?: number;

  startTime?: Date;
  endTime?: Date;

  otp?: string;

  rideId: Types.ObjectId; // Reference to Ride
}
