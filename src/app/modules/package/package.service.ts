import { PackageModel } from './package.model';
import { IPackage, PaymentStatus } from './package.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { isValidObjectId, Types } from 'mongoose';
import { findNearestOnlineRiders } from '../ride/ride.service';
import { sendNotifications } from '../../../util/notificaton';
import {
  calculateDistanceBasedFare,
  getDistanceFromLatLonInKm,
} from '../../../util/calculateDistance';
import generateOTP from '../../../util/generateOTP';
import stripe from '../../../config/stripe';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { DailyEarning } from '../earning/erning.model';

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
  const serviceName = 'package';

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

  // Find nearby drivers (within 5km)
  const nearestDrivers = await findNearestOnlineRiders({
    coordinates: [pickup.lng, pickup.lat],
  });

  if (!nearestDrivers.length) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No available drivers near your pickup location.'
    );
  }

  // Send socket notifications to each driver

  if (createdPackage._id && io) {
    nearestDrivers.forEach(driver => {
      const driverId = driver?._id?.toString();
      sendNotifications({
        text: 'New Package delivery request available',
        receiver: driverId,
        serviceName,
        // packageId: createdPackage._id,
        // userId: createdPackage.userId,
        // receiver: driver._id, // socket room: driver-specific
        pickupLocation: createdPackage.pickupLocation,
        dropoffLocation: createdPackage.dropoffLocation,
        status: createdPackage.packageStatus,
        fare: createdPackage.fare,
        distance: createdPackage.distance,
        // event: 'package-requested', // custom event name
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
    text: '📦 Your Package delivery has been accepted by a driver!',
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

// ! start otp
// request start ride otp
const requestStaratOTPPackage = async (rideId: string, driverId: string) => {
  const ride = await PackageModel.findById(rideId);

  if (!ride) {
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
const requestCompleteOTPPackage = async (
  rideId: string,
  enteredOtp: string
) => {
  console.log('Verifying OTP for ride:', rideId, 'with OTP:', enteredOtp);

  const ride = await PackageModel.findById(rideId).select('+otp');

  if (!ride) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not found');
  }

  if (!ride.otp || ride.otp.toString().trim() === '') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No OTP generated for this ride'
    );
  }

  if (ride.otp.toString() !== enteredOtp.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  // ✅ FIXED: Correct status condition for atomic update
  const updatedRide = await PackageModel.findOneAndUpdate(
    {
      _id: rideId,
      otp: ride.otp,
    },
    {
      $unset: { otp: '' },
    },
    { new: true }
  );

  if (!updatedRide) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Ride state changed during verification'
    );
  }

  sendNotifications({
    rideId: updatedRide._id,
    receiver: updatedRide._id,
    text: 'Package OTP match start successfully',
  });

  return updatedRide;
};

const continuePackageDeliver = async (
  packageId: string,
  driverId: Types.ObjectId
) => {
  const existing = await PackageModel.findOne({ _id: packageId });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }

  if (existing.packageStatus !== 'accepted') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Only accepted packages can be continued'
    );
  }

  existing.packageStatus = 'continue';

  await existing.save();

  sendNotifications({
    text: '📦 Package delivery has been continued by the driver.',
    packageId: existing._id,
    userId: existing.userId,
    receiver: existing.userId?.toString(),
    pickupLocation: existing.pickupLocation,
    dropoffLocation: existing.dropoffLocation,
    status: existing.packageStatus,
    fare: existing.fare,
    distance: existing.distance,
    event: 'package-continued',
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

  if (pkg.packageStatus !== 'continue') {
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
    text: '✅ Your Package has been successfully delivered!',
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

  if (!ride || ride.packageStatus !== 'delivered') {
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

  const ride = await PackageModel.findById(rideId).select('+otp');

  if (!ride) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not found');
  }

  if (ride.packageStatus !== 'delivered') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not in progress');
  }

  if (!ride.otp || ride.otp.toString().trim() === '') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No OTP generated for this ride'
    );
  }

  if (ride.otp.toString() !== enteredOtp.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  // ✅ FIXED: Correct status condition for atomic update
  const updatedRide = await PackageModel.findOneAndUpdate(
    {
      _id: rideId,
      otp: ride.otp,
      packageStatus: 'delivered', // correct current state
    },
    {
      $set: { packageStatus: 'completed' }, // final state
      $unset: { otp: '' },
    },
    { new: true }
  );

  if (!updatedRide) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Ride state changed during verification'
    );
  }

  sendNotifications({
    rideId: updatedRide._id,
    receiver: updatedRide._id,
    text: 'Package deleverd completed successfully',
  });

  return updatedRide;
};

const createPackagePayment = async (payload: {
  packageId: string;
  userId: string;
}) => {
  const { packageId, userId } = payload;

  // Validate input
  if (!packageId || !isValidObjectId(packageId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid packageId is required');
  }

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid userId is required');
  }

  // Fetch package
  const packageDoc = await PackageModel.findById(packageId);
  if (!packageDoc) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }

  const fare = packageDoc.fare;
  const driverId = packageDoc.driverId;
  const method = packageDoc.paymentMethod;

  if (!method || !['stripe', 'offline'].includes(method)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payment method');
  }

  if (!driverId || !isValidObjectId(driverId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid driverId');
  }

  if (!fare || fare <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid fare');
  }

  // Split amount
  const adminAmount = +(fare * 0.1).toFixed(2);
  const driverAmount = +(fare * 0.9).toFixed(2);

  let paymentStatus: PaymentStatus = 'paid';
  let transactionId: string;
  let stripeSessionUrl: string | undefined;

  if (method === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Package Delivery Payment',
              description: `Payment for package ID: ${packageId}`,
            },
            unit_amount: Math.round(fare * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://re-cycle-mart-client.vercel.app/success',
      cancel_url: 'https://re-cycle-mart-client.vercel.app/cancelled',
      metadata: {
        packageId: packageId.toString(),
        userId: userId.toString(),
        method,
        amount: fare.toString(),
      },
    });

    stripeSessionUrl = session.url ?? undefined;
    transactionId = session.id;
    paymentStatus = 'paid'; // Later webhook confirm will finalize
  } else {
    paymentStatus = 'paid';
    transactionId = `offline_txn_${Date.now()}`;
  }

  // Create payment record
  const payment = await Payment.create({
    packageId,
    userId,
    method,
    status: paymentStatus,
    transactionId,
    sessionUrl: stripeSessionUrl,
    amount: fare,
    paidAt: paymentStatus === 'paid' ? new Date() : undefined,
    driverId,
    adminAmount,
    driverAmount,
  });

  if (!payment) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Payment creation failed'
    );
  }

  // Update Package.paymentStatus
  if (paymentStatus === 'paid') {
    packageDoc.paymentStatus = 'paid';
    await packageDoc.save();

    // Update driver stats
    await User.findByIdAndUpdate(driverId, {
      $inc: {
        driverTotalEarn: driverAmount,
      },
    });

    // Update admin stats
    await User.updateOne(
      { role: 'admin' },
      {
        $inc: {
          adminRevenue: adminAmount,
        },
      },
      { sort: { createdAt: 1 } }
    );

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalTrip: 1,
        totalAmountSpend: fare,
      },
    });
    // ✅ Update DailyEarning Summary
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const methodBasedField =
      method === 'stripe'
        ? { onlinePaymentReceived: driverAmount }
        : { cashPaymentReceived: driverAmount };

    const updatedEarning = await DailyEarning.findOneAndUpdate(
      { driverId, date: startOfDay },
      {
        $inc: {
          todayTotalEarning: driverAmount,
          ...methodBasedField,
        },
      },
      { upsert: true, new: true }
    );

    // ✅ Recalculate Available Earning
    if (updatedEarning) {
      updatedEarning.todayAvailableEarning =
        updatedEarning.todayTotalEarning - (updatedEarning.walletAmount || 0);

      await updatedEarning.save();
    }
  }

  return {
    payment,
    redirectUrl: stripeSessionUrl,
  };
};

export const PackageService = {
  createPackageToDB,
  acceptPackageByDriver,
  continuePackageDeliver,

  // ! start otp
  requestStaratOTPPackage,
  requestCompleteOTPPackage,

  markPackageAsDelivered,
  requestClosePackage,
  completePackageWithOtp,
  createPackagePayment,
};
