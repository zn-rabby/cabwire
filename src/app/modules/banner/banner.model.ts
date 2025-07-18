import { model, Schema } from 'mongoose';
import { BannerModel, IBanner } from './banner.interface';

const bannerSchema = new Schema<IBanner, BannerModel>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Banner = model<IBanner, BannerModel>('Banner', bannerSchema);
