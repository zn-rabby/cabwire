import { model, Schema } from 'mongoose';
import { INotification, NotificationModel } from './notification.interface';

export const locationSchema = {
  lat: { type: Number, required: false },
  lng: { type: Number, required: false },
  address: { type: String },
};

//  rideId: ride._id,
//     userId: ride.id,
//     pickupLocation: ride.pickupLocation,
//     dropoffLocation: ride.dropoffLocation,
//     status: ride.rideStatus,
//     fare: ride.fare,
//     distance: ride.distance,
//     duration: ride.duration,
const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    text: {
      type: String,
      required: false,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    referenceId: {
      type: String,
      required: false,
    },

    screen: {
      type: String,
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    rideAccept: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['ADMIN'],
      required: false,
    },
    // for ride
    driverId: {
      type: String,
      required: false,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    pickupLocation: locationSchema,
    dropoffLocation: locationSchema,
    fare: { type: Number },
    distance: { type: Number },
    duration: { type: Number },
    rideProgress: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification, NotificationModel>(
  'Notification',
  notificationSchema
);
