import { Schema, model, Model, Document } from 'mongoose';
import { ICarService } from './car.interface';

// Schema with only the input fields you mentioned
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

export const CarServiceModel: Model<ICarService> = model<ICarService>(
  'CarService',
  CarServiceSchema
);
