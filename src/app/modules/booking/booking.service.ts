import { Types } from 'mongoose';
import { IRideBooking } from './booking.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Ride } from '../ride/ride.model';
import { RideBooking } from './booking.model';
// import { Service } from '../service/service.model'; // assuming service.model exists

const createRideBookingToDB = async (
  payload: Partial<IRideBooking>,
  driverObjectId: Types.ObjectId
) => {
  if (!payload.rideId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'rideId is required');
  }

  // 🔍 Find ride
  const ride = await Ride.findById(payload.rideId);
  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Associated ride not found');
  }

  if (!ride.distance || ride.distance <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Valid distance in ride is required'
    );
  } 
  let fare = ride.fare;
 
  payload.fare = fare;
  payload.driverId = driverObjectId;

  // ⬇️ Create booking
  const booking = await RideBooking.create(payload);
  if (!booking) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create ride booking'
    );
  }

  // 🔁 Update ride status
  await Ride.findByIdAndUpdate(payload.rideId, {
    rideStatus: 'accepted',
  });

  // 🔗 Populate rideId
  const bookingWithRide = await RideBooking.findById(booking._id).populate(
    'rideId'
  );

  return bookingWithRide;
};

export const RideBookingService = {
  createRideBookingToDB,
};
