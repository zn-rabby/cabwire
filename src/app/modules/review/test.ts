// model
// const reviewSchema = new Schema<IReview, ReviewModel>(
//   {
//     serviceType: {
//       type: String,
//       enum: ['Ride', 'RentalCar', 'PackageDelivery'],
//       required: true,
//     },
//     serviceId: {
//       type: Schema.Types.ObjectId,
//       required: true,
//       refPath: 'serviceType', // 👈 dynamic reference here
//     },
//     user: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     comment: {
//       type: String,
//       required: true,
//     },
//     rating: {
//       type: Number,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

//
// const createReviewToDB = async (payload: IReview): Promise<IReview> => {
//   const { serviceId, serviceType, rating } = payload;

//   if (!mongoose.Types.ObjectId.isValid(serviceId)) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service ID');
//   }

//   // 🧠 Dynamically select model
//   let serviceModel;
//   switch (serviceType) {
//     case 'Ride':
//       serviceModel = Ride;
//       break;
//     case 'RentalCar':
//       serviceModel = RentalCar;
//       break;
//     case 'PackageDelivery':
//       serviceModel = PackageDelivery;
//       break;
//     default:
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Service Type');
//   }

//   // 🔍 Find the service document
//   const service = await serviceModel.findById(serviceId);
//   if (!service) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'No Service Found');
//   }

//   // ✅ Validate rating
//   const numericRating = Number(rating);
//   if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid rating value');
//   }

//   // ✅ Update rating stats
//   const previousTotalRating = Number(service.totalRating) || 0;
//   const previousRating = Number(service.rating) || 0;
//   const totalRating = previousTotalRating + 1;

//   let newRating = numericRating;
//   if (previousTotalRating > 0) {
//     newRating =
//       (previousRating * previousTotalRating + numericRating) / totalRating;
//   }

//   service.totalRating = totalRating;
//   service.rating = parseFloat(newRating.toFixed(2));
//   await service.save();

//   // ✅ Save review
//   const result = await Review.create(payload);
//   if (!result) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create review');
//   }

//   return result;
// };
