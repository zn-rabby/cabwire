// const createRideBookingToDB = async (
//   payload: Partial<IRideBooking>,
//   userObjectId: Types.ObjectId // auth থেকে passenger userId
// ) => {
//   // Validation
//   if (!payload.rideId) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'rideId is required');
//   }
//   if (!payload.paymentMethod) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'paymentMethod is required');
//   }
//   if (!payload.seatsBooked || payload.seatsBooked <= 0) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'seatsBooked must be > 0');
//   }

//   // রাইড ডাটাবেজ থেকে ফেচ করুন
//   const ride = await CabwireModel.findById(payload.rideId);
//   if (!ride) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Associated ride not found');
//   }

//   if (
//     !ride.perKM ||
//     !ride.pickupLocation ||
//     !ride.dropoffLocation ||
//     !ride.setAvailable
//   ) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Incomplete ride data');
//   }

//   // Calculate distance and fare
//   const distance = calculateDistance(ride.pickupLocation, ride.dropoffLocation);
//   const fare = Math.round(distance * ride.perKM * payload.seatsBooked);

//   if (payload.seatsBooked > ride.setAvailable) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       `Only ${ride.setAvailable} seat(s) available`
//     );
//   }

//   // এখানে driverId আসবে ride.driverId থেকে
//   const driverId = ride.driverId;

//   // Booking data প্রস্তুত করুন
//   const bookingPayload: Partial<IRideBooking> = {
//     ...payload,
//     fare,
//     distance,
//     userId: userObjectId, // auth থেকে passenger
//     driverId, // ride.driverId থেকে ড্রাইভার
//     rideStatus: 'accepted',
//     paymentStatus: 'pending',
//   };

//   // Booking তৈরি করুন
//   const booking = await RideBooking.create(bookingPayload);
//   if (!booking) {
//     throw new ApiError(
//       StatusCodes.INTERNAL_SERVER_ERROR,
//       'Booking creation failed'
//     );
//   }

//   // Ride এর seat কমান এবং status আপডেট করুন
//   await CabwireModel.findByIdAndUpdate(payload.rideId, {
//     $inc: { setAvailable: -payload.seatsBooked },
//     rideStatus: 'accepted',
//   });

//   // Booking এ ride populate করুন
//   const bookingWithRide = await RideBooking.findById(booking._id).populate(
//     'rideId'
//   );

//   // Notification পাঠান ড্রাইভারকে
//   sendNotifications({
//     text: 'New ride booking accepted!',
//     rideId: ride._id,
//     userId: driverId?.toString(), // ড্রাইভারকে জানানো হচ্ছে
//     receiver: driverId?.toString(),
//     pickupLocation: ride.pickupLocation,
//     dropoffLocation: ride.dropoffLocation,
//     status: 'accepted',
//     fare,
//     distance,
//     duration: ride.duration,
//   });

//   return bookingWithRide;
// };
