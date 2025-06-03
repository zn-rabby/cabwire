import { PackageModel } from './package.model';
import { IPackage } from './package.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

// Distance formula
const getDistanceFromLatLonInKm = (
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Radius of Earth in km
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

// Simple fare calculation based on distance only
const calculateDistanceBasedFare = (distance: number): number => {
  const baseFare = 50; // Flat base fare
  const ratePerKm = 20; // Per km rate
  return Math.round(baseFare + distance * ratePerKm);
};

const createPackageToDB = async (
  payload: Partial<IPackage>,
  userId: Types.ObjectId
) => {
  const { pickupLocation, dropoffLocation } = payload;

  if (
    !pickupLocation?.lat ||
    !pickupLocation?.lng ||
    !dropoffLocation?.lat ||
    !dropoffLocation?.lng
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Pickup and dropoff coordinates are required.'
    );
  }

  // ✅ Calculate distance
  const distance = getDistanceFromLatLonInKm(pickupLocation, dropoffLocation);

  // ✅ Calculate fare based on distance
  const fare = calculateDistanceBasedFare(distance);

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

export const PackageService = {
  createPackageToDB,
  acceptPackageByDriver,
};
