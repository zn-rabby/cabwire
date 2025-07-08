import { model, Schema } from 'mongoose';
import { IReview, ReviewModel } from './review.interface';

const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    serviceType: {
      type: String,
      enum: ['Ride', 'Cabwire', 'Package'],
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'serviceType', // dynamic reference here
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Review = model<IReview, ReviewModel>('Review', reviewSchema);
