import { CabwireModel } from './cabwire.model';
import { ICabwire } from './cabwire.interface';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { sendNotifications } from '../../../util/notificaton';

const createRideByDriver = async (payload: ICabwire): Promise<ICabwire> => {
  const {
    pickupLocation,
    dropoffLocation,
    driverId,
    distance,
    duration,
    perKM,
    setAvailable,
    paymentMethod,
    lastBookingTime,
  } = payload;

  // ✅ Input validation
  if (!driverId || !pickupLocation || !dropoffLocation || !distance || !perKM) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required ride data missing');
  }

  // 💵 Fare Calculation
  const fare = Math.round(distance * perKM);

  // 🧱 Ride Data Build
  const rideData: Partial<ICabwire> = {
    driverId: new Types.ObjectId(driverId),
    pickupLocation,
    dropoffLocation,
    distance,
    duration: duration || 0,
    fare,
    rideStatus: 'requested',
    setAvailable: setAvailable ?? 1,
    paymentMethod: paymentMethod ?? 'offline',
    paymentStatus: 'pending',
    lastBookingTime: lastBookingTime ?? Date.now() + 15 * 60 * 1000, // default 15 mins later
    perKM,
  };

  // 🚀 Create Ride
  const ride = await CabwireModel.create(rideData);
  console.log('ride=', ride);

  // 📡 Send Notification via Socket
  sendNotifications({
    text: 'Ride created successfully!',
    rideId: ride._id,
    userId: ride.driverId, // Notification belongs to driver
    receiver: ride.driverId?.toString(), // for socket emit
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    status: ride.rideStatus,
    fare: ride.fare,
    distance: ride.distance,
    duration: ride.duration,
  });

  return ride;
};

export const CabwireService = {
  createRideByDriver,
};
