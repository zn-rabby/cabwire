import { isValidObjectId, Types } from 'mongoose';
import { IRideBooking, PaymentStatus } from './booking.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { RideBooking } from './booking.model';
import { CabwireModel } from '../cabwire/cabwire.model';
import { calculateDistance } from '../../../util/calculateDistance';
import { sendNotifications } from '../../../util/notificaton';
import generateOTP from '../../../util/generateOTP';
import { User } from '../user/user.model';
import { Payment } from '../payment/payment.model';
import stripe from '../../../config/stripe';
import { DailyEarning } from '../earning/erning.model';

const createRideBookingToDB = async (
  payload: Partial<IRideBooking>,
  userObjectId: Types.ObjectId
) => {
  // Validation
  if (!payload.rideId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'rideId is required');
  }
  if (!payload.paymentMethod) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'paymentMethod is required');
  }
  if (!payload.seatsBooked || payload.seatsBooked <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'seatsBooked must be > 0');
  }

  // Fetch ride
  const ride = await CabwireModel.findById(payload.rideId);
  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Associated ride not found');
  }

  if (
    !ride.perKM ||
    !ride.pickupLocation ||
    !ride.dropoffLocation ||
    !ride.setAvailable
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Incomplete ride data');
  }

  // Calculate distance and fare
  const distance = calculateDistance(ride.pickupLocation, ride.dropoffLocation);
  const fare = Math.round(distance * ride.perKM * payload.seatsBooked);

  if (payload.seatsBooked > ride.setAvailable) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Only ${ride.setAvailable} seat(s) available`
    );
  }

  // Get driver ID
  const driverId = ride.driverId;

  // Prepare booking data
  const bookingPayload: Partial<IRideBooking> = {
    ...payload,
    fare,
    distance,
    userId: userObjectId,
    driverId,
    rideStatus: 'accepted',
    paymentStatus: 'pending',
  };

  // Create booking
  const booking = await RideBooking.create(bookingPayload);
  if (!booking) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Booking creation failed'
    );
  }

  // Generate user-specific OTP
  // const otp = generateOTP().toString();

  // Update ride: push to users[] and update seat availability
  await CabwireModel.findByIdAndUpdate(payload.rideId, {
    $push: {
      users: {
        userId: userObjectId,
        seats: payload.seatsBooked,
        // otp,
        isVerified: false,
        bookingId: booking._id,
      },
    },
    $inc: { setAvailable: -payload.seatsBooked },
    rideStatus: 'accepted',
  });

  // Populate ride data in booking
  const bookingWithRide = await RideBooking.findById(booking._id).populate(
    'rideId'
  );

  // Notify driver
  sendNotifications({
    text: 'New ride booking accepted!',
    rideId: ride._id,
    userId: driverId?.toString(),
    receiver: driverId?.toString(),
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    status: 'accepted',
    fare,
    distance,
    duration: ride.duration,
  });

  return bookingWithRide;
};

// ! booking otp generate

const requestStartOTPRides = async (rideId: string, driverId: string) => {
  // Fetch ride with users
  const ride = await CabwireModel.findById(rideId);

  if (!ride || ride.rideStatus !== 'book') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Ride not found or not in booked status'
    );
  }

  if (!Array.isArray(ride.users) || ride.users.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No users found in this ride');
  }

  // Generate OTP for each user
  const updatedUsers = ride.users.map(userObj => {
    return {
      userId: userObj.userId,
      seats: userObj.seats,
      bookingId: userObj.bookingId,
      otp: generateOTP().toString(),
      isVerified: false,
    };
  });

  ride.users = updatedUsers;
  ride.markModified('users');
  await ride.save();

  console.log('✅ OTPs generated for ride:', ride._id);

  return {
    rideId: ride._id,
    otps: updatedUsers.map(({ userId, otp }) => ({
      userId,
      otp,
    })),
  };
};

const cancelRide = async (rideId: string, driverId: string) => {
  const ride = await CabwireModel.findById(rideId);

  if (!ride || !['requested', 'accepted'].includes(ride.rideStatus)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or ride status must be requested or accepted'
    );
  }
  // Update status
  ride.rideStatus = 'cancelled';
  await ride.save();

  // Emit ride-cancelled event
  if (ride._id) {
    sendNotifications({
      text: 'New ride booking cancelled!',
      receiver: ride._id, // For socket emit
      rideId: ride._id,
      driverId,
    });
  }

  return ride;
};

const continueRide = async (rideId: string, driverId: string) => {
  const ride = await CabwireModel.findById(rideId);

  if (!ride || !['requested', 'accepted'].includes(ride.rideStatus)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already in progress'
    );
  }

  // Update Cabwire ride status
  ride.rideStatus = 'continue';
  await ride.save();

  // Ensure driverId is ObjectId
  const updatedBooking = await RideBooking.findOneAndUpdate(
    {
      rideId: ride._id,
      driverId: new Types.ObjectId(driverId),
    },
    { $set: { rideStatus: 'continue' } },
    { new: true }
  );

  if (!updatedBooking) {
    console.log('No matching RideBooking found for this driver and ride.');
  } else {
    console.log('Updated RideBooking:', updatedBooking);
  }

  // Send notification
  sendNotifications({
    text: 'Your Cabwire ride is now in continue!',
    receiver: ride._id,
    rideId: ride._id,
    driverId,
  });

  return ride;
};

// request colose ride
const requestCloseRide = async (rideId: string, driverId: string) => {
  const ride = await CabwireModel.findById(rideId);

  if (!ride || ride.rideStatus !== 'continue') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or ride not in progress'
    );
  }

  if (!Array.isArray(ride.users) || ride.users.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No users found in this ride');
  }

  // Generate OTP per user
  ride.users = ride.users.map(userObj => ({
    ...userObj.toObject?.(), // make sure it's a plain object
    otp: generateOTP().toString(),
    isVerified: false,
  }));

  ride.markModified('users');
  await ride.save();

  console.log('✅ Close OTPs generated for ride:', ride._id);

  return {
    rideId: ride._id,
    otps: ride.users.map(({ userId, otp }) => ({
      userId,
      otp,
    })),
  };
};

// complete ride with otp
const completeRideWithOtp = async (rideId: string, enteredOtp: string) => {
  console.log('Verifying OTP for ride:', rideId, 'with OTP:', enteredOtp);

  // First check if ride exists and get current OTP
  const ride = await CabwireModel.findById(rideId).select('+otp'); // Explicitly include otp

  if (!ride) {
    console.log('Ride not found');
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not found');
  }

  console.log('Ride details:', {
    rideId: ride._id,
    status: ride.rideStatus,
    storedOtp: ride.otp,
    otpType: typeof ride.otp,
    enteredOtp,
    enteredOtpType: typeof enteredOtp,
  });

  if (ride.rideStatus !== 'continue') {
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
  const updatedRide = await CabwireModel.findOneAndUpdate(
    {
      _id: rideId,
      otp: ride.otp, // Ensure OTP hasn't changed
      rideStatus: 'continue',
    },
    {
      $set: { rideStatus: 'completed' },
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

const createCabwireOrBookingPayment = async (payload: {
  sourceId: string;
  userId: string;
}) => {
  const { sourceId, userId } = payload;

  // ✅ 1. Validate IDs
  if (!isValidObjectId(sourceId) || !isValidObjectId(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid IDs are required');
  }

  // ✅ 2. Fetch ride
  const ride = await CabwireModel.findById(sourceId);
  if (!ride)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Cabwire ride not found');

  const fare = ride.fare;
  const driverId = ride.driverId?.toString();
  const method = ride.paymentMethod?.toLowerCase();

  if (!fare || !driverId || !method) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ride data');
  }

  if (!['stripe', 'offline'].includes(method)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payment method');
  }

  // ✅ 3. Calculate driver/admin shares
  const driverAmount = +(fare * 0.9).toFixed(2);
  const adminAmount = +(fare * 0.1).toFixed(2);

  // let paymentStatus: 'pending' | 'paid' =
  //   method === 'offline' ? 'paid' : 'pending';

  let paymentStatus: PaymentStatus = 'paid';
  let transactionId: string;
  let stripeSessionUrl: string | undefined;

  // ✅ 4. Handle Stripe payment session
  if (method === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Cabwire Fare',
              description: `Payment for Cabwire ride ID: ${sourceId}`,
            },
            unit_amount: Math.round(fare * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://re-cycle-mart-client.vercel.app/success',
      cancel_url: 'https://re-cycle-mart-client.vercel.app/cancelled',
      metadata: {
        // sourceId,
        // userId,
        // method,
        // sourceType: 'cabwire',
        rideId: sourceId.toString(),
        userId: userId.toString(),
        method,
        amount: fare.toString(),
      },
    });

    transactionId = session.id;
    stripeSessionUrl = session.url ?? undefined;
    paymentStatus = 'paid';
  } else {
    transactionId = `offline_${Date.now()}`;
  }

  // ✅ 5. Create Payment doc
  const payment = await Payment.create({
    rideId: sourceId,
    userId,
    driverId,
    method,
    status: paymentStatus,
    transactionId,
    sessionUrl: stripeSessionUrl,
    amount: fare,
    driverAmount,
    adminAmount,
    paidAt: paymentStatus === 'paid' ? new Date() : undefined,
  });

  console.log('🔥 Payment created:', payment._id);
  console.log('💳 Payment status:', paymentStatus);

  // ✅ 6. Only handle stats if offline (Stripe will be handled via webhook)
  // if (paymentStatus === 'paid') {
  //   await CabwireModel.findByIdAndUpdate(sourceId, {
  //     paymentStatus: 'paid',
  //   });

  //   await User.findByIdAndUpdate(driverId, {
  //     $inc: { driverTotalEarn: driverAmount },
  //   });

  //   await User.updateOne(
  //     { role: 'admin' },
  //     { $inc: { adminRevenue: adminAmount } },
  //     { sort: { createdAt: 1 } }
  //   );

  //   await User.findByIdAndUpdate(userId, {
  //     $inc: {
  //       totalAmountSpend: fare,
  //       totalTrip: 1,
  //     },
  //   });
  // }
  if (paymentStatus === 'paid') {
    ride.paymentStatus = 'paid';
    await ride.save();

    // ✅ Update Driver Stats
    await User.findByIdAndUpdate(driverId, {
      $inc: {
        driverTotalEarn: driverAmount,
      },
    });

    // ✅ Update Admin Stats
    await User.updateOne(
      { role: 'admin' },
      { $inc: { adminRevenue: adminAmount } },
      { sort: { createdAt: 1 } }
    );

    // ✅ Update User Stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalAmountSpend: fare,
        totalTrip: 1,
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

  // ✅ 7. Return result
  return {
    payment,
    redirectUrl: stripeSessionUrl,
  };
};

export const RideBookingService = {
  createRideBookingToDB,
  cancelRide,
  // ! booking otp generate
  requestStartOTPRides,

  continueRide,
  requestCloseRide,
  completeRideWithOtp,
  createCabwireOrBookingPayment,
};
