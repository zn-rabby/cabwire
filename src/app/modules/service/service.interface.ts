import { Model, Types } from 'mongoose';

export type IService = {
  name:
    | 'car'
    | 'emergency-car'
    | 'rental-car'
    | 'cabwire-share'
    | 'package-delivery';

  // category: Types.ObjectId;
  image: string;
  baseFare: number;
  // status?: 'active' | 'delete';
};

export type ServiceModel = Model<IService>;
