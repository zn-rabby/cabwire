import { Model, Types } from 'mongoose';
export interface ILocation {
  lat?: number;
  lng?: number;
  address?: string;
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
  rideId?: string;
  packgeId?: string;
  userId?: string;
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
};

export type NotificationModel = Model<INotification>;
