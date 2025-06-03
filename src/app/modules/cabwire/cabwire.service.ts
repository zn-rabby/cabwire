import { CabwireModel } from './cabwire.model';
import { ICabwire } from './cabwire.interface';
import { Types } from 'mongoose';

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

export const CabwireService = {
  createRideByDriver,
  bookRideByUser,
};
