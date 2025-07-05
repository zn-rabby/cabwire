import { Model } from 'mongoose';

export type IService = {
  serviceName:
    | 'car'
    | 'emergency-car'
    | 'rental-car'
    | 'cabwire-share'
    | 'package';

  // category: Types.ObjectId;
  image: string;
  baseFare: number;
  status?: 'active' | 'block';
};

export type ServiceModel = Model<IService>;
