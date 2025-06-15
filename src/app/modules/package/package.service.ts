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
import generateOTP from '../../../util/generateOTP';

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
  sendNotifications({
    text: '📦 Your package delivery has been accepted by a driver!',
    packageId: existing._id,
    userId: existing.userId,
    receiver: existing.userId?.toString(), // socket room/user ID
    pickupLocation: existing.pickupLocation,
    dropoffLocation: existing.dropoffLocation,
    status: existing.packageStatus,
    fare: existing.fare,
    distance: existing.distance,
    event: 'package-accepted', // custom event for frontend
  });
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

  // 🔔 Send real-time socket notification to the user
  sendNotifications({
    text: '✅ Your package has been successfully delivered!',
    packageId: pkg._id,
    userId: pkg.userId,
    receiver: pkg.userId?.toString(), // Socket room or user ID
    pickupLocation: pkg.pickupLocation,
    dropoffLocation: pkg.dropoffLocation,
    status: pkg.packageStatus,
    event: 'package-delivered', // Custom frontend socket event
  });

  return pkg;
};
// request colose ride
const requestClosePackage = async (rideId: string, driverId: string) => {
  const ride = await PackageModel.findById(rideId);

  if (!ride || ride.packageStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or ride not in progress'
    );
  }

  const otp = generateOTP();

  // Save as string and mark as modified
  ride.otp = otp.toString();
  ride.markModified('otp'); // Explicitly mark the field as modified
  await ride.save();

  console.log(
    'Generated OTP for ride:',
    ride._id,
    'OTP:',
    ride.otp,
    'Type:',
    typeof ride.otp
  );

  return {
    rideId: ride._id,
    otp: ride.otp,
  };
};

// complete ride with otp
const completePackageWithOtp = async (rideId: string, enteredOtp: string) => {
  console.log('Verifying OTP for ride:', rideId, 'with OTP:', enteredOtp);

  // First check if ride exists and get current OTP
  const ride = await PackageModel.findById(rideId).select('+otp'); // Explicitly include otp

  if (!ride) {
    console.log('Ride not found');
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not found');
  }

  console.log('Ride details:', {
    rideId: ride._id,
    status: ride.packageStatus,
    storedOtp: ride.otp,
    otpType: typeof ride.otp,
    enteredOtp,
    enteredOtpType: typeof enteredOtp,
  });

  if (ride.packageStatus !== 'accepted') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not in progress');
  }

  if (!ride.otp || ride.otp.toString().trim() === '') {
    console.error('OTP missing in ride document');
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No OTP generated for this ride'
    );
  }

  // Compare as strings
  if (ride.otp.toString() !== enteredOtp.toString()) {
    console.log('OTP mismatch:', {
      stored: ride.otp,
      entered: enteredOtp,
      storedType: typeof ride.otp,
      enteredType: typeof enteredOtp,
    });
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  // Use atomic update
  const updatedRide = await PackageModel.findOneAndUpdate(
    {
      _id: rideId,
      otp: ride.otp, // Ensure OTP hasn't changed
      rideStatus: 'delivered',
    },
    {
      $set: { rideStatus: 'delivered' },
      $unset: { otp: '' },
    },
    { new: true }
  );

  if (!updatedRide) {
    console.error('Concurrent modification detected');
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Ride state changed during verification'
    );
  }

  // Emit ride-completed event
  if (updatedRide._id) {
    sendNotifications({
      // event: 'ride-completed',
      rideId: updatedRide._id,
      receiver: updatedRide._id,
      text: 'Ride completed successfully',
    });
  }

  console.log('Ride completed successfully:', updatedRide._id);
  return updatedRide;
};

export const PackageService = {
  createPackageToDB,
  acceptPackageByDriver,
  markPackageAsDelivered,
  requestClosePackage,
  completePackageWithOtp,
};
