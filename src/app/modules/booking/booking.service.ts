import { Types } from 'mongoose';
import { IRideBooking } from './booking.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Ride } from '../ride/ride.model';
import { RideBooking } from './booking.model';
import { CabwireModel } from '../cabwire/cabwire.model';
import { ICabwire } from '../cabwire/cabwire.interface';

const createRideBookingToDB = async (
  payload: Partial<IRideBooking>,
  driverObjectId: Types.ObjectId
) => {
  // ✅ Input Validation
  if (!payload.rideId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'rideId is required');
  }

  if (!payload.paymentMethod) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'paymentMethod is required');
  }

  if (!payload.seatsBooked || payload.seatsBooked <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'seatsBooked must be > 0');
  }

  // 🔍 Find Ride by rideId
  const ride = await CabwireModel.findById(payload.rideId);
  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Associated ride not found');
  }

  // ✅ Validate ride data
  if (!ride.distance || ride.distance <= 0 || !ride.fare) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid ride data required');
  }

  // 🧮 Check available seats
  const availableSeats = ride.setAvailable || 0;

  if (payload.seatsBooked > availableSeats) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Not enough seats available. Only ${availableSeats} seat(s) left.`
    );
  }

  // 💵 Calculate fare (Optional: based on seat if fare is per person)
  const fare = ride.fare;

  // 🎯 Prepare Booking Payload
  const bookingPayload: Partial<IRideBooking> = {
    ...payload,
    fare,
    driverId: driverObjectId,
    rideStatus: 'accepted',
    paymentStatus: 'pending',
  };

  // ✅ Create RideBooking
  const booking = await RideBooking.create(bookingPayload);
  if (!booking) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Booking creation failed'
    );
  }

  // 🔄 Update Ride: reduce setAvailable seats & change rideStatus
  await CabwireModel.findByIdAndUpdate(payload.rideId, {
    $inc: { setAvailable: -payload.seatsBooked }, // reduce available seats
    rideStatus: 'accepted',
  });

  // 🔗 Return populated booking with ride info
  const bookingWithRide = await RideBooking.findById(booking._id).populate(
    'rideId'
  );

  return bookingWithRide;
};


const bookRideByUser = async (
  rideId: string,
  userId: Types.ObjectId
): Promise<ICabwire | null> => {
  const ride = await CabwireModel.findOne({
    _id: rideId,
    rideStatus: 'requested',
  });

  if (!ride) {
    throw new Error('Ride not available for booking');
  }

  // Update ride status to accepted
  ride.rideStatus = 'book';
  await ride.save();

  return ride;
};

const cancelRide = async (rideId: string, driverId: string) => {
  const ride = await CabwireModel.findById(rideId);

  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already cancelled'
    );
  }

  // Only assigned driver can cancel
  // if (ride.driverId?.toString() !== driverId.toString()) {
  //   throw new ApiError(
  //     StatusCodes.FORBIDDEN,
  //     'You are not authorized to cancel this ride'
  //   );
  // }

  // Update status
  ride.rideStatus = 'cancelled';
  await ride.save();

  // Emit ride-cancelled event
  if (global.io && ride._id) {
    global.io.emit('ride-cancelled::', {
      rideId: ride._id,
      driverId,
    });
  }

  return ride;
};

const continueRide = async (rideId: string, driverId: string) => {
  const ride = await CabwireModel.findById(rideId);

  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already continue'
    );
  }
  // Only assigned driver can cancel
  // if (ride.driverId?.toString() !== driverId.toString()) {
  //   throw new ApiError(
  //     StatusCodes.FORBIDDEN,
  //     'You are not authorized to cancel this ride'
  //   );
  // }
  ride.rideStatus = 'continue';
  await ride.save();

  if (global.io && ride._id) {
    global.io.emit('ride-continue::', {
      rideId: ride._id,
      driverId,
    });
  }
  return ride;
};

export const RideBookingService = {
  createRideBookingToDB,
  bookRideByUser,
  cancelRide,
  continueRide,
};
