import { Schema, model } from 'mongoose';
import { IPackage } from './package.interface';

const locationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false }
);

const packageSchema = new Schema<IPackage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },

    myPay: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reciverPay: { type: Schema.Types.ObjectId, ref: 'User' },

    pickupLocation: { type: locationSchema, required: true },
    dropoffLocation: { type: locationSchema, required: true },

    distance: { type: Number },
    duration: { type: Number },
    fare: { type: Number },

    rideStatus: {
      type: String,
      enum: ['requested', 'accepted', 'delivered'],
      default: 'requested',
    },

    paymentMethod: {
      type: String,
      enum: ['stripe', 'offline'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    otp: { type: String },
    paymentID: { type: String },
    orderId: { type: String },

    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const PackageModel = model<IPackage>('Package', packageSchema);
