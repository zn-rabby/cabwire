import { IRide } from './ride.interface';
import { Ride } from './ride.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { Category } from '../category/category.model';
import { Service } from '../service/service.model';
import { calculateFare } from './ride.utils';
import { User } from '../user/user.model';
import generateOTP from '../../../util/generateOTP';
import { calculateDistance } from '../../../util/calculateDistance';

// find nearest riders
const findNearestOnlineRiders = async (location: {
  lat?: number;
  lng?: number;
}) => {
  if (
    !location ||
    typeof location.lat !== 'number' ||
    typeof location.lng !== 'number'
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or missing lat/lng');
  }

  const coordinates: [number, number] = [location.lng, location.lat]; // GeoJSON expects [lng, lat]

  const result = await User.find({
    role: 'DRIVER',
    // isOnline: true,
    'geoLocation.coordinates': { $ne: [0, 0] },
    geoLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: 5000, // 5 km radius
      },
    },
  });

  return result;
};

const createRideToDB = async (
  payload: Partial<IRide>,
  userObjectId: Types.ObjectId
) => {
  const pickup = payload.pickupLocation;
  const dropoff = payload.dropoffLocation;

  // Validate pickup & dropoff
  if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Pickup and dropoff coordinates are required.'
    );
  }

  // Validate duration
  if (typeof payload.duration !== 'number' || payload.duration <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Duration must be a positive number.'
    );
  }

  // Validate service & category
  if (!payload.service || !payload.category) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Service and category are required.'
    );
  }

  // Fetch service & category
  const [service, category] = await Promise.all([
    Service.findById(payload.service),
    Category.findById(payload.category),
  ]);

  if (!service || !category) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid service or category ID.'
    );
  }

  // Calculate distance
  const distance = calculateDistance(pickup, dropoff);

  // Calculate fare
  let fare: number;
  try {
    fare = calculateFare({
      service,
      category,
      distance,
      duration: payload.duration,
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to calculate fare: ' +
        (error instanceof Error ? error.message : '')
    );
  }

  // Create ride
  const ride = await Ride.create({
    ...payload,
    userId: userObjectId,
    distance,
    fare,
    rideStatus: 'requested',
    paymentStatus: 'pending',
  });

  // Find nearest drivers (within 5km)
  const nearestDrivers = await findNearestOnlineRiders({
    lat: pickup.lat,
    lng: pickup.lng,
  });

  if (!nearestDrivers.length) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No available drivers near your pickup location.'
    );
  }
  console.log('dd', nearestDrivers);

  // @ts-ignore
  const io = global.io;

  if (io && ride?._id) {
    // Emit to each driver in their specific room
    nearestDrivers.forEach(driver => {
      io.to(`driver::${driver._id}`).emit('ride-requested', {
        rideId: ride._id,
        userId: ride.userId,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
        status: ride.rideStatus,
        fare: ride.fare,
        distance: ride.distance,
        duration: ride.duration,
      });
    });
  }

  return ride;
};

const acceptRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already accepted'
    );
  }

  ride.driverId = new Types.ObjectId(driverId);
  ride.rideStatus = 'accepted';
  await ride.save();

  // @ts-ignore
  const io = global.io;

  if (io && ride?._id) {
    // Notify the passenger in their user-specific room
    io.to(`user::${ride.userId}`).emit('ride-accepted', {
      rideId: ride._id,
      driverId,
      rideStatus: ride.rideStatus,
    });

    // Notify all participants in the ride room
    io.to(`ride::${ride._id}`).emit('ride-status-updated', {
      rideId: ride._id,
      status: ride.rideStatus,
      driverId,
    });
  }

  return ride;
};

const cancelRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

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
  const ride = await Ride.findById(rideId);

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
  // Update status
  ride.rideStatus = 'continue';
  await ride.save();

  // Emit ride-continue event
  if (global.io && ride._id) {
    global.io.emit('ride-continue::', {
      rideId: ride._id,
      driverId,
    });
  }

  return ride;
};
const requestCloseRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride || ride.rideStatus !== 'continue') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or ride not in progress'
    );
  }

  const otp = generateOTP();
  // Explicitly convert OTP to number before saving
  ride.otp = Number(otp);
  await ride.save();

  return {
    rideId: ride._id,
    otp: Number(otp), // ensure number type in response
  };
};
const completeRideWithOtp = async (rideId: string, enteredOtp: number) => {
  console.log('Verifying OTP for ride:', rideId, 'with OTP:', enteredOtp);

  // First find the ride without any session
  const ride = await Ride.findById(rideId);

  if (!ride) {
    console.log('Ride not found with ID:', rideId);
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not found');
  }

  console.log('Found ride:', {
    id: ride._id,
    status: ride.rideStatus,
    storedOtp: ride.otp,
    typeOfStoredOtp: typeof ride.otp,
    enteredOtp,
    typeOfEnteredOtp: typeof enteredOtp,
  });

  if (ride.rideStatus !== 'continue') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not in progress');
  }

  if (!ride.otp) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No OTP generated for this ride'
    );
  }

  // Compare OTPs after ensuring same type
  if (Number(ride.otp) !== Number(enteredOtp)) {
    console.log('OTP mismatch:', {
      stored: ride.otp,
      entered: enteredOtp,
    });
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  // Use findOneAndUpdate for atomic update
  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      otp: ride.otp, // Ensure OTP hasn't changed
      rideStatus: 'continue', // Ensure status hasn't changed
    },
    {
      $set: { rideStatus: 'completed' },
      $unset: { otp: 1 },
    },
    { new: true } // Return the updated document
  );

  if (!updatedRide) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Ride state changed during verification'
    );
  }

  return updatedRide;
};
export const RideService = {
  findNearestOnlineRiders,
  createRideToDB,
  acceptRide,
  cancelRide,
  continueRide,
  requestCloseRide,
  completeRideWithOtp,
};
