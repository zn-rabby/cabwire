import { Model } from 'mongoose';

export type ICarService = {
  name: string;
  type: 'economy' | 'premium' | 'luxury';
  image: string;
  basePrice: number;
  status?: 'active' | 'delete';
};

export type ServiceModel = Model<ICarService>;
