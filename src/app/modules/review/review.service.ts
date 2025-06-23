import mongoose from 'mongoose';
import { IReview } from './review.interface';
import { Review } from './review.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Ride } from '../ride/ride.model';

const createReviewToDB = async (payload: IReview): Promise<IReview> => {
  if (!mongoose.Types.ObjectId.isValid(payload.service)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service ID');
  }

  const service: any = await Ride.findById(payload.service);
  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No Service Found');
  }

  // Parse and validate rating
  const rating = Number(payload.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid rating value');
  }

  // Safe fallback values
  const previousTotalRating = Number(service.totalRating) || 0;
  const previousRating = Number(service.rating) || 0;

  const totalRating = previousTotalRating + 1;

  let newRating = rating;
  if (previousTotalRating > 0) {
    newRating = (previousRating * previousTotalRating + rating) / totalRating;
  }

  service.totalRating = totalRating;
  service.rating = parseFloat(newRating.toFixed(2));

  await service.save();

  const result = await Review.create(payload);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create review');
  }

  return result;
};

const getReviewFromDB = async (id: any) => {
  const reviews = await Review.findById(id);
  if (!reviews) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'not found');
  }
  return reviews;
};

const getReviewsFromDB = async (id: any): Promise<IReview[]> => {
  // Validate ID before making a database call
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Offer ID');
  }

  const reviews = await Review.find({ service: id });
  return reviews;
};

export const ReviewService = {
  createReviewToDB,
  getReviewFromDB,
  getReviewsFromDB,
};