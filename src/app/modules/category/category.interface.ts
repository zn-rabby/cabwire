import { ObjectId } from 'mongoose';

export interface ICategory {
  _id: ObjectId;
  name: 'economy' | 'premium' | 'luxury';
  basePrice: number;
  ratePerKm?: number;
  ratePerHour?: number;
  isActive: boolean;
  isDeleted: boolean;
}
