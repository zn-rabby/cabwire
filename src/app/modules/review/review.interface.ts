import { Types, Model } from 'mongoose';

export type ServiceType = 'Ride' | 'Cabwire' | 'Package';

export interface IReview {
  serviceType: ServiceType;
  serviceId: Types.ObjectId; // Dynamic ref based on serviceType
  user: Types.ObjectId; // Ref to User
  comment: string;
  rating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

 
export type ReviewModel = Model<IReview>;

export interface IRateableService extends Document {
  save: any;
  totalRating: number;
  rating: number;
}
