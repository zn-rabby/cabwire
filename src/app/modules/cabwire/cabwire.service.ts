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
// const bookRideByUser = async (
//   rideId: string,
//   userId: Types.ObjectId
// ): Promise<ICabwire | null> => {
//   const ride = await CabwireModel.findOne({
//     _id: rideId,
//     rideStatus: 'requested',
//   });

//   if (!ride) {
//     throw new Error('Ride not available for booking');
//   }

//   // Update ride status to accepted
//   ride.rideStatus = 'book';
//   await ride.save();

//   return ride;
// };

// const cancelRide = async (rideId: string, driverId: string) => {
//   const ride = await CabwireModel.findById(rideId);

//   if (!ride || ride.rideStatus !== 'requested') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Invalid ride or already cancelled'
//     );
//   }

//   // Only assigned driver can cancel
//   // if (ride.driverId?.toString() !== driverId.toString()) {
//   //   throw new ApiError(
//   //     StatusCodes.FORBIDDEN,
//   //     'You are not authorized to cancel this ride'
//   //   );
//   // }

//   // Update status
//   ride.rideStatus = 'cancelled';
//   await ride.save();

//   // Emit ride-cancelled event
//   if (global.io && ride._id) {
//     global.io.emit('ride-cancelled::', {
//       rideId: ride._id,
//       driverId,
//     });
//   }

//   return ride;
// };

// const continueRide = async (rideId: string, driverId: string) => {
//   const ride = await CabwireModel.findById(rideId);

//   if (!ride || ride.rideStatus !== 'requested') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Invalid ride or already continue'
//     );
//   }
//   // Only assigned driver can cancel
//   // if (ride.driverId?.toString() !== driverId.toString()) {
//   //   throw new ApiError(
//   //     StatusCodes.FORBIDDEN,
//   //     'You are not authorized to cancel this ride'
//   //   );
//   // }
//   ride.rideStatus = 'continue';
//   await ride.save();

//   if (global.io && ride._id) {
//     global.io.emit('ride-continue::', {
//       rideId: ride._id,
//       driverId,
//     });
//   }
//   return ride;
// };

export const CabwireService = {
  createRideByDriver,
  // bookRideByUser,
  // cancelRide,
  // continueRide,
};
