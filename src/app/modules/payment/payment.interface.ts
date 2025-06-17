// import { Document, Types } from 'mongoose';
// import { PaymentMethod, PaymentStatus } from '../ride/ride.interface';

// export interface IPayment extends Document {
//   rideId: Types.ObjectId;
//   userId: Types.ObjectId;
//   // bookingId: Types.ObjectId;
//   amount: number;
//   method: PaymentMethod;
//   status: PaymentStatus;
//   transactionId?: string;
//   orderId?: string;
//   signature?: string;
//   paidAt?: Date;
// }

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

  driverId: Types.ObjectId; // কে টাকা পেয়েছে
  adminId: Types.ObjectId; // কে ফি নিয়েছে

  driverAmount: number; // ড্রাইভারের পাওনা (৯০%)
  adminAmount: number; // অ্যাডমিনের ফি (১০%)
}
