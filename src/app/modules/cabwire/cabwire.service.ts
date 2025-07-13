import { CabwireModel } from './cabwire.model';
import { ICabwire } from './cabwire.interface';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { sendNotifications } from '../../../util/notificaton';

const createRideByDriver = async (
  payload: Partial<ICabwire>,
  driverId: string
): Promise<ICabwire> => {
  const {
    pickupLocation,
    dropoffLocation,
    distance,
    duration,
    perKM,
    setAvailable,
    paymentMethod,
    lastBookingTime,
  } = payload;

  // Input validation
  if (!pickupLocation || !dropoffLocation || !distance || !perKM) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required ride data missing');
  }

  // Fare calculation
  const fare = Math.round(distance * perKM);

  // Build ride data with driverId from auth
  const rideData: Partial<ICabwire> = {
    driverId: new Types.ObjectId(driverId), // auth থেকে driverId সেট করলাম
    pickupLocation,
    dropoffLocation,
    distance,
    duration: duration || 0,
    fare,
    rideStatus: 'requested',
    setAvailable: setAvailable ?? 1,
    paymentMethod: paymentMethod ?? 'offline',
    paymentStatus: 'pending',
    lastBookingTime: lastBookingTime ?? Date.now() + 15 * 60 * 1000,
    perKM,
  };

  // Create ride
  const ride = await CabwireModel.create(rideData);

  // Send notification to driver (auth driver)
  sendNotifications({
    text: 'Ride created successfully!',
    rideId: ride._id,
    userId: driverId,
    receiver: driverId,
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    status: ride.rideStatus,
    fare: ride.fare,
    distance: ride.distance,
    duration: ride.duration,
  });

  return ride;
};

const getAllCabwireRidesFromDB = async (): Promise<ICabwire[]> => {
  const rides = await CabwireModel.find()
    .populate('driverId')
    .sort({ createdAt: -1 });

  return rides;
};
export const CabwireService = {
  createRideByDriver,
  getAllCabwireRidesFromDB,
};
