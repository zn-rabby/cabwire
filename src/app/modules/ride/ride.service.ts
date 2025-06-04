import { IRide } from './ride.interface';
import { Ride } from './ride.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { Category } from '../category/category.model';
import { Service } from '../service/service.model';
import { calculateFare } from './ride.utils';
import { User } from '../user/user.model';

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
    isOnline: true,
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

// ✅ Helper to calculate distance using lat/lng
const getDistanceFromLatLonInKm = (
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in km
  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLon = toRad(dropoff.lng - pickup.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pickup.lat)) *
      Math.cos(toRad(dropoff.lat)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const createRideToDB = async (
  payload: Partial<IRide>,
  userObjectId: Types.ObjectId
) => {
  const pickup = payload.pickupLocation;
  const dropoff = payload.dropoffLocation;

  // ✅ Validate pickup & dropoff coordinates
  if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Pickup and dropoff coordinates are required.'
    );
  }

  // ✅ Validate duration
  if (typeof payload.duration !== 'number' || payload.duration <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Duration must be a positive number.'
    );
  }

  // ✅ Validate service & category
  if (!payload.service || !payload.category) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Service and category are required.'
    );
  }

  // ✅ Fetch service & category data
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

  // ✅ Calculate distance
  const distance = getDistanceFromLatLonInKm(pickup, dropoff);

  // ✅ Calculate fare
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

  // ✅ Prepare ride data
  const rideData: Partial<IRide> = {
    ...payload,
    distance,
    fare,
    userId: userObjectId,
    rideStatus: 'requested',
    paymentStatus: 'pending',
  };

  // ✅ Create ride
  const ride = await Ride.create(rideData);

  // ✅ Access global io
  const io = global.io;

  if (io && ride.pickupLocation) {
    io.emit('ride-requested', {
      rideId: ride._id,
      userId: ride.userId,
      coordinates: ride.pickupLocation,
      status: ride.rideStatus,
    });
  }

  return ride;
};

export const RideService = {
  findNearestOnlineRiders,
  createRideToDB,
};
