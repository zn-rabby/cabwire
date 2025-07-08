import mongoose from 'mongoose';
import { IRateableService, IReview } from './review.interface';
import { Review } from './review.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Ride } from '../ride/ride.model';
import { PackageModel } from '../package/package.model';
import { CabwireModel } from '../cabwire/cabwire.model';

// const createReviewToDB = async (payload: IReview): Promise<IReview> => {
//   if (!mongoose.Types.ObjectId.isValid(payload.service)) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service ID');
//   }

//   const service: any = await Ride.findById(payload.service);
//   if (!service) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'No Service Found');
//   }

//   // Parse and validate rating
//   const rating = Number(payload.rating);
//   if (isNaN(rating) || rating < 1 || rating > 5) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid rating value');
//   }

//   // Safe fallback values
//   const previousTotalRating = Number(service.totalRating) || 0;
//   const previousRating = Number(service.rating) || 0;

//   const totalRating = previousTotalRating + 1;

//   let newRating = rating;
//   if (previousTotalRating > 0) {
//     newRating = (previousRating * previousTotalRating + rating) / totalRating;
//   }

//   service.totalRating = totalRating;
//   service.rating = parseFloat(newRating.toFixed(2));

//   await service.save();

//   const result = await Review.create(payload);
//   if (!result) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create review');
//   }

//   return result;
// };

const createReviewToDB = async (payload: IReview): Promise<IReview> => {
  const { serviceId, serviceType, rating } = payload;

  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service ID');
  }

  let serviceModel: mongoose.Model<any>; // 👈 Fix: use generic Mongoose model

  switch (serviceType) {
    case 'Ride':
      serviceModel = Ride;
      break;
    case 'Cabwire':
      serviceModel = CabwireModel;
      break;
    case 'Package':
      serviceModel = PackageModel;
      break;
    default:
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service Type');
  }

  // 🔍 Fetch service and cast to IRateableService
  const service = (await serviceModel.findById(
    serviceId
  )) as IRateableService | null;

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No Service Found');
  }

  // ✅ Validate rating
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid rating value');
  }

  const previousTotalRating = service.totalRating || 0;
  const previousRating = service.rating || 0;
  const totalRating = previousTotalRating + 1;

  let newRating = numericRating;
  if (previousTotalRating > 0) {
    newRating =
      (previousRating * previousTotalRating + numericRating) / totalRating;
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
  console.log(reviews);
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
