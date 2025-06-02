import { Model, Types } from 'mongoose';

export type IService = {
  name:
    | 'rental-car'
    | 'emergency-car-booking'
    | 'car-booking'
    | 'package-delivery';

  // category: Types.ObjectId;
  image: string;
  baseFare: number;
  // status?: 'active' | 'delete';
};

export type ServiceModel = Model<IService>;
