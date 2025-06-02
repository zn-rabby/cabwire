import { Model } from 'mongoose';

export type IBanner = {
  name: string;
  image: string;
  description: string;
};

export type BannerModel = Model<IBanner>;
