import { model, Schema } from 'mongoose';
import { INotification, NotificationModel } from './notification.interface';

export const locationSchema = {
  lat: { type: Number, required: false },
  lng: { type: Number, required: false },
  address: { type: String },
};

// Chat subdocument schema for notification
const notificationChatSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Chat',
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
  },
  { _id: false } // Prevent nested _id in this subdocument
);

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
      required: false,
    },
    packgeId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: false,
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
    rideComplete: {
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
    serviceName: {
      type: String,
      enum: ['car', 'emergency-car', 'rental-car', 'cabwire-share', 'package'],
      required: false,
    },

    // Add chat as subdocument
    chat: {
      type: notificationChatSchema,
      required: false,
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
