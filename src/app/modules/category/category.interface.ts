import { ObjectId } from 'mongoose';

export interface ICategory {
  _id: ObjectId;
  name:
    | 'car'
    | 'emergency-car' ;
  type: 'economy' | 'premium' | 'luxury';
  basePrice: number; // Base fare for this category
  ratePerKm: number; // Fare per kilometer
  ratePerHour: number;
  isActive: boolean; // Used to enable/disable the category
  isDeleted: boolean; // Soft delete indicator
}
