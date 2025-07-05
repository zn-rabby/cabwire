import { Schema, model, Document } from 'mongoose';
import { ICategory } from './category.interface';

// 2. Schema for Category
const CategorySchema = new Schema<ICategory>(
  {
    categoryName: {
      type: String,
      enum: ['economy', 'premium', 'luxury'],
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    ratePerKm: {
      type: Number,
      required: true,
      min: 0,
    },
    ratePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'block'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// 3. Model export
export const Category = model<ICategory>('Category', CategorySchema);
