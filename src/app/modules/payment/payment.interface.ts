import { Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../ride/ride.interface';

export interface IPayment extends Document {
  rideId: Types.ObjectId;
  userId: Types.ObjectId;

  amount: number; // total fare
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  orderId?: string;
  signature?: string;
  paidAt?: Date;

  driverId: Types.ObjectId;
  adminId?: Types.ObjectId;

  driverAmount: number;
  availableAmount: number;
  totalWithdorwAmount: number;
  adminAmount: number;
}
