import { Schema, model, Model, Document } from 'mongoose';
import { ICarService } from './car.interface';

const CarServiceSchema = new Schema<ICarService>({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['economy', 'premium', 'luxury'],
  },
  image: { type: String, required: true },
  basePrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['active', 'delete'],
    default: 'active',
  },
});

export const CarService: Model<ICarService> = model<ICarService>(
  'CarService',
  CarServiceSchema
);
