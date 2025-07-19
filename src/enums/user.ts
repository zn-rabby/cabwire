export enum USER_ROLES {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  PASSANGER = 'PASSANGER',
  DRIVER = 'DRIVER',
}

export interface ILocation {
  lat?: number;
  lng?: number;
  address?: string;
}

export type packageStatus =
  | 'requested'
  | 'accepted'
  | 'delivered'
  | 'continue'
  | 'completed';
export type PaymentMethod = 'stripe' | 'offline';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'continue'
  | 'clouse'
  | 'cancelled'
  | 'completed';

export type RideType = 'Car' | 'EmergencyCar' | 'RentalCar';
