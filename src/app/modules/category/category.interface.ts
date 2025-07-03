import { ObjectId } from 'mongoose';

export interface ICategory {
  _id: ObjectId;
  categoryName: 'economy' | 'premium' | 'luxury';
  basePrice: number;
  ratePerKm?: number;
  ratePerHour?: number;
  status?: 'active' | 'block';
  isActive: boolean;
  isDeleted: boolean;
}
