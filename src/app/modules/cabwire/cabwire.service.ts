import { CabwireModel } from './cabwire.model';
import { ICabwire } from './cabwire.interface';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';

const createRideByDriver = async (payload: ICabwire): Promise<ICabwire> => {
  const ride = await CabwireModel.create(payload);
  return ride;
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
  ride.rideStatus = 'accepted';
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

export const CabwireService = {
  createRideByDriver,
  bookRideByUser,
  cancelRide,
  continueRide,
};
