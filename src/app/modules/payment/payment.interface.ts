import { Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../ride/ride.interface';

export interface IPayment extends Document {
  rideId: Types.ObjectId;
  userId: Types.ObjectId;
  // bookingId: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  orderId?: string;
  signature?: string;
  paidAt?: Date;
}
