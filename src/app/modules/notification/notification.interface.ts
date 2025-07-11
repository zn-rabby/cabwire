import { Model, Types } from 'mongoose';
export interface ILocation {
  lat?: number;
  lng?: number;
  address?: string;
}

//  rideId: ride._id,
//     userId: ride.id,
//     pickupLocation: ride.pickupLocation,
//     dropoffLocation: ride.dropoffLocation,
//     status: ride.rideStatus,
//     fare: ride.fare,
//     distance: ride.distance,
//     duration: ride.duration,

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
  userId?: string;
  pickupLocation?: ILocation;
  dropoffLocation?: ILocation;
  fare?: number;
  rideAccept?: boolean;
  distance?: number;
  duration?: number;
  rideProgress?: boolean;
};

export type NotificationModel = Model<INotification>;
