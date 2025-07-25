import { Schema, model } from 'mongoose';
import { IService, ServiceModel } from './service.interface';

const serviceSchema = new Schema<IService, ServiceModel>(
  {
    serviceName: {
      type: String,
      enum: ['car', 'emergency-car', 'rental-car', 'cabwire-share', 'package'],
      required: true,
      unique: true,
    },
    // category: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Category',
    //   required: true,
    // },
    image: {
      type: String,
      default: '',
      required: true,
    },
    baseFare: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'block'],
      default: 'active',
    },
    // ratePerKm: {
    //   type: Number,
    //   required: true,
    // },
    // ratePerHour: {
    //   type: Number,
    //   required: true,
    // },
    // maxHours: {
    //   type: Number,
    //   required: true,
    // },
  },
  {
    timestamps: true,
  }
);

export const Service = model<IService, ServiceModel>('Service', serviceSchema);
