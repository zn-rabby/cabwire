import { PackageModel } from './package.model';
import { IPackage } from './package.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { findNearestOnlineRiders } from '../ride/ride.service';
import { sendNotifications } from '../../../util/notificaton';
import {
  calculateDistanceBasedFare,
  getDistanceFromLatLonInKm,
} from '../../../util/calculateDistance';

const createPackageToDB = async (
  payload: Partial<IPackage>,
  userId: Types.ObjectId
): Promise<IPackage> => {
  const pickup = payload.pickupLocation;
  const dropoff = payload.dropoffLocation;

  // ✅ Validate location
  if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Pickup and dropoff coordinates are required.'
    );
  }

  // 📏 Calculate distance (in km)
  const distance = getDistanceFromLatLonInKm(pickup, dropoff);

  // 💰 Calculate fare based on distance
  let fare: number;
  try {
    fare = calculateDistanceBasedFare(distance);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to calculate fare: ' +
        (error instanceof Error ? error.message : '')
    );
  }

  // 🧱 Build and save the package
  const packageData: Partial<IPackage> = {
    ...payload,
    userId,
    distance,
    fare,
    packageStatus: 'requested',
    paymentStatus: 'pending',
  };

  const createdPackage = await PackageModel.create(packageData);

  if (!createdPackage) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create package request.'
    );
  }

  // 📍 Find nearest online drivers within 5km
  const nearestDrivers = await findNearestOnlineRiders({
    coordinates: [pickup.lng, pickup.lat], // Consistent with ride system
  });

  if (!nearestDrivers.length) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No available drivers near your pickup location.'
    );
  }

  // 🔔 Send socket notifications to each driver
  const io = global.io;
  if (createdPackage._id && io) {
    nearestDrivers.forEach(driver => {
      sendNotifications({
        text: 'New package delivery request available',
        packageId: createdPackage._id,
        userId: createdPackage.userId,
        receiver: driver._id, // socket room: driver-specific
        pickupLocation: createdPackage.pickupLocation,
        dropoffLocation: createdPackage.dropoffLocation,
        status: createdPackage.packageStatus,
        fare: createdPackage.fare,
        distance: createdPackage.distance,
        event: 'package-requested', // custom event name
      });
    });
  }

  return createdPackage;
};

const acceptPackageByDriver = async (
  packageId: string,
  driverId: Types.ObjectId
) => {
  const existing = await PackageModel.findOne({ _id: packageId });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }

  if (existing.packageStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Package is not available for booking'
    );
  }

  existing.driverId = driverId;
  existing.packageStatus = 'accepted';
  existing.acceptedAt = new Date();

  await existing.save();
  return existing;
};

const markPackageAsDelivered = async (
  packageId: string,
  driverId: Types.ObjectId
) => {
  const pkg = await PackageModel.findOne({ _id: packageId });

  if (!pkg) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }

  if (!pkg.driverId || pkg.driverId.toString() !== driverId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not assigned to this package'
    );
  }

  if (pkg.packageStatus !== 'accepted') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Package is not in accepted state'
    );
  }

  pkg.packageStatus = 'delivered';
  pkg.deliveredAt = new Date();

  await pkg.save();
  return pkg;
};

export const PackageService = {
  createPackageToDB,
  acceptPackageByDriver,
  markPackageAsDelivered,
};
