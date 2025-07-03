import { Model, Types } from 'mongoose';

export type IService = {
  serviceName: 'car' | 'emergency-car' | 'rental-car';

  // category: Types.ObjectId;
  image: string;
  baseFare: number;
  status?: 'active' | 'block';
};

export type ServiceModel = Model<IService>;
