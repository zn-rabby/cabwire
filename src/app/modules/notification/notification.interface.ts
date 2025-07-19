
import { Model, Types } from 'mongoose';

// আগের Location interface
export interface ILocation {
  lat?: number;
  lng?: number;
  address?: string;
}

// Chat info for notification
export interface INotificationChat {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
}

export type INotification = {
  text: string;
  receiver?: Types.ObjectId;
  read: boolean;
  referenceId?: string;
  screen?: 'RESERVATION' | 'CHAT';
  type?: 'ADMIN';

  // for ride
  driverId?: string;
  rideId?: Types.ObjectId;
  packgeId?: Types.ObjectId;
  userId?: Types.ObjectId;
  pickupLocation?: ILocation;
  dropoffLocation?: ILocation;
  fare?: number;
  rideAccept?: boolean;
  rideComplete?: boolean;
  distance?: number;
  duration?: number;
  serviceName?:
    | 'car'
    | 'emergency-car'
    | 'rental-car'
    | 'cabwire-share'
    | 'package';
  rideProgress?: boolean;

  // Add chat info here
  chat?: INotificationChat;
};

export type NotificationModel = Model<INotification>;
