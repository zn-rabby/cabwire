import { Schema, model } from 'mongoose';
import { IService, ServiceModel } from './service.interface';

const serviceSchema = new Schema<IService, ServiceModel>(
  {
    name: {
      type: String,
      enum: [
        'car',
        'rental-car',
        'cabwire-share',
        'package-delivery',
      ],
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
      required: true,
    },
    baseFare: {
      type: Number,
      required: true,
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
    // status: {
    //   type: String,
    //   enum: ['active', 'delete'],
    //   default: 'active',
    // },
  },
  {
    timestamps: true,
  }
);

export const Service = model<IService, ServiceModel>('Service', serviceSchema);
