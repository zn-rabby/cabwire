import { IRide, PaymentStatus } from './ride.interface';
import { Ride } from './ride.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { isValidObjectId, Types } from 'mongoose';
import { Category } from '../category/category.model';
import { Service } from '../service/service.model';
import { calculateFare } from './ride.utils';
import { User } from '../user/user.model';
import generateOTP from '../../../util/generateOTP';
import { calculateDistance } from '../../../util/calculateDistance';
import { sendNotifications } from '../../../util/notificaton';
import { IPayment } from '../payment/payment.interface';
import stripe from '../../../config/stripe';
import { Payment } from '../payment/payment.model';

// find nearest riders
export const findNearestOnlineRiders = async (location: {
  coordinates: [number, number];
}) => {
  if (
    !location.coordinates ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid coordinates');
  }
  const result = await User.find({
    role: 'DRIVER',
    isOnline: true,
    'geoLocation.coordinates': { $ne: [0, 0] },
    geoLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location.coordinates,
        },
        $maxDistance: 50000, // 5 km radius
      },
    },
  });
  return result;
};

const updateDriverLocation = async (
  driverId: string,
  payload: { coordinates: [number, number] }
) => {
  if (!payload || !payload.coordinates) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Coordinates payload is required'
    );
  }

  const { coordinates } = payload;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid coordinates');
  }

  const updatedDriver = await User.findByIdAndUpdate(
    driverId,
    {
      $set: {
        geoLocation: {
          type: 'Point',
          coordinates,
        },
        isOnline: true,
      },
    },
    { new: true }
  );

  if (!updatedDriver) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Driver not found');
  }

  sendNotifications({
    receiver: updatedDriver._id, // receiver user id
    driverId: driverId, // same driver id for clarity
    text: 'Driver location updated successfully',
  });

  return updatedDriver;
};

// create ride
// const createRideToDB = async (
//   payload: Partial<IRide>,
//   userObjectId: Types.ObjectId
// ) => {
//   const pickup = payload.pickupLocation;
//   const dropoff = payload.dropoffLocation;

//   // Validate input
//   if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Pickup and dropoff coordinates are required.'
//     );
//   }

//   if (typeof payload.duration !== 'number' || payload.duration <= 0) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Duration must be a positive number.'
//     );
//   }

//   if (!payload.service || !payload.category) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Service and category are required.'
//     );
//   }

//   // Fetch service & category
//   const [service, category] = await Promise.all([
//     Service.findById(payload.service),
//     Category.findById(payload.category),
//   ]);
//   if (!service || !category) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Invalid service or category ID.'
//     );
//   }

//   const distance = calculateDistance(pickup, dropoff);

//   let fare: number;
//   try {
//     fare = calculateFare({
//       service,
//       category,
//       distance,
//       duration: payload.duration,
//     });
//   } catch (error) {
//     throw new ApiError(
//       StatusCodes.INTERNAL_SERVER_ERROR,
//       'Failed to calculate fare: ' +
//         (error instanceof Error ? error.message : '')
//     );
//   }

//   // Create ride
//   const ride = await Ride.create({
//     ...payload,
//     userId: userObjectId,
//     distance,
//     fare,
//     rideStatus: 'requested',
//     paymentStatus: 'pending',
//   });

//   // Find nearby drivers (within 5km)
//   const nearestDrivers = await findNearestOnlineRiders({
//     coordinates: [pickup.lng, pickup.lat],
//   });
//   console.log('nearsest drivers=', nearestDrivers);

//   if (!nearestDrivers.length) {
//     throw new ApiError(
//       StatusCodes.NOT_FOUND,
//       'No available drivers near your pickup location.'
//     );
//   }

//   // Emit socket events to each driver room
//   const io = global.io;

//   if (ride?._id) {
//     nearestDrivers.forEach(driver => {
//       console.log(44, driver?._id);
//       sendNotifications({
//         text: 'Ride created successfully',
//         rideId: ride._id,
//         userId: ride.userId,
//         receiver: driver?._id, // socket emit এই receiver আইডিতে হবে
//         pickupLocation: ride.pickupLocation,
//         dropoffLocation: ride.dropoffLocation,
//         status: ride.rideStatus,
//         fare: ride.fare,
//         distance: ride.distance,
//         duration: ride.duration,
//         event: 'ride-requested', // custom event name
//       });
//     });
//   }

//   return ride;
// };

// create ride
const createRideToDB = async (
  payload: Partial<IRide>,
  userObjectId: Types.ObjectId
) => {
  const pickup = payload.pickupLocation;
  const dropoff = payload.dropoffLocation;

  // Validate input
  if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Pickup and dropoff coordinates are required.'
    );
  }

  if (typeof payload.duration !== 'number' || payload.duration <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Duration must be a positive number.'
    );
  }

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

  const distance = calculateDistance(pickup, dropoff);

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

  // Emit socket events to each driver room
  const io = global.io;

  if (ride?._id) {
    const rideIdString = ride._id.toString(); // ✅ Fix: convert to string

    nearestDrivers.forEach(driver => {
      const driverId = driver?._id?.toString();
      console.log('🔔 Sending notification to driver:', driverId);
      console.log('🚗 Ride ID:', rideIdString);

      sendNotifications({
        text: 'Ride created successfully',
        rideId: rideIdString,

        userId: ride.userId.toString(),
        receiver: driverId,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
        status: ride.rideStatus,
        fare: ride.fare,
        distance: ride.distance,
        duration: ride.duration,
        event: 'ride-requested',
      });
    });
  }

  return ride;
};

// accept ride
// const acceptRide = async (rideId: string, driverId: string) => {
//   const ride = await Ride.findById(rideId);
//   if (!ride || ride.rideStatus !== 'requested') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Invalid ride or already accepted'
//     );
//   }
//   // Atomic update check
//   const updatedRide = await Ride.findOneAndUpdate(
//     { _id: rideId, rideStatus: 'requested' },
//     {
//       driverId: new Types.ObjectId(driverId),
//       rideStatus: 'accepted',
//     },
//     { new: true }
//   );

//   if (!updatedRide) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Ride has already been accepted by another driver.'
//     );
//   }
//   if (updatedRide._id) {
//     sendNotifications({
//       // receiver: updatedRide._id,
//       receiver: updatedRide.userId,
//       driverId,
//       text: 'Ride accept successsfully',
//     });
//   }
//   return updatedRide;
// };

const acceptRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already accepted'
    );
  }

  let updatedRide;

  try {
    updatedRide = await Ride.findOneAndUpdate(
      { _id: rideId, rideStatus: 'requested' },
      {
        driverId: new Types.ObjectId(driverId),
        rideStatus: 'accepted',
      },
      { new: true }
    );
  } catch (err) {
    console.error('MongoDB update error:', err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update ride'
    );
  }

  if (!updatedRide) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Ride has already been accepted by another driver.'
    );
  }

  const rideAccept = true;
  // ✅ Send notification with required rideId
  try {
    if (updatedRide.userId) {
      await sendNotifications({
        receiver: updatedRide.userId.toString(),
        driverId: driverId.toString(),
        rideId: updatedRide.id.toString(), // ✅ this is the fix!
        text: 'Ride accepted successfully',
        event: 'ride-accepted',
        rideAccept: rideAccept,
      });
    } else {
      console.warn('No userId found in updatedRide');
    }
  } catch (err) {
    console.error('Notification sending failed:', err);
  }

  return updatedRide;
};

// cancel ride

// const cancelRide = async (rideId: string, driverId: string) => {
//   const ride = await Ride.findById(rideId);

//   if (!ride) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Ride not found');
//   }

//   if (ride.rideStatus !== 'requested') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       `Only 'requested' rides can be rejected`
//     );
//   }

//   // Push current driverId to rejectedDrivers list
//   if (!ride.rejectedDrivers) {
//     ride.rejectedDrivers = [];
//   }

//   const objectIdDriver = new Types.ObjectId(driverId);
//   const alreadyRejected = ride.rejectedDrivers.some(id =>
//     id.equals(objectIdDriver)
//   );

//   if (!alreadyRejected) {
//     ride.rejectedDrivers.push(objectIdDriver);
//     await ride.save();
//   }

//   // Notify user that driver rejected
//   sendNotifications({
//     receiver: ride.userId,
//     driverId,
//     rideId: ride._id,
//     text: 'A driver has rejected your ride request.',
//     event: 'ride-rejected',
//   });

//   return {
//     message: 'Ride rejected by this driver. Still visible to others.',
//     rideId: ride._id,
//   };
// };
const cancelRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already cancelled/accepted'
    );
  }

  const objectIdDriver = new Types.ObjectId(driverId);

  // Prevent duplicate rejection
  const alreadyRejected =
    ride.rejectedDrivers?.some(id => id.equals(objectIdDriver)) || false;

  if (alreadyRejected) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'This driver has already rejected the ride.'
    );
  }

  let updatedRide;

  try {
    updatedRide = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        rideStatus: 'requested',
        rejectedDrivers: { $ne: objectIdDriver },
      },
      {
        $push: { rejectedDrivers: objectIdDriver },
      },
      { new: true }
    );
  } catch (err) {
    console.error('MongoDB update error during rejection:', err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update ride rejection'
    );
  }

  if (!updatedRide) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Ride not found or already rejected by this driver.'
    );
  }

  try {
    if (updatedRide.userId) {
      await sendNotifications({
        receiver: updatedRide.userId,
        driverId,
        rideId: updatedRide._id,
        text: 'A driver has rejected your ride request.',
        event: 'ride-rejected',
      });
    } else {
      console.warn('No userId found in updatedRide');
    }
  } catch (err) {
    console.error('Notification sending failed:', err);
    // Don't crash server, just log
  }

  return {
    message: 'Ride rejected by this driver. Still visible to other drivers.',
    rideId: updatedRide._id,
  };
};

// continue rid
// const continueRide = async (rideId: string, driverId: string) => {
//   const ride = await Ride.findById(rideId);

//   if (!ride || ride.rideStatus !== 'accepted') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Invalid ride or already continued'
//     );
//   }

//   ride.rideStatus = 'continue';
//   await ride.save();

//   // Notify the rider via socket
//   if (ride._id) {
//     sendNotifications({
//       receiver: ride.userId, // ✅ corrected
//       driverId,
//       rideId: ride._id,
//       text: 'Your ride is now in progress.',
//     });
//   }

//   return ride;
// };

const continueRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    console.error('Ride not found:', rideId);
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride not found');
  }

  if (ride.rideStatus !== 'accepted') {
    console.error('Ride status not accepted:', ride.rideStatus);
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already continued'
    );
  }

  ride.rideStatus = 'continue';

  try {
    await ride.save();
  } catch (err) {
    console.error('Error saving ride:', err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update ride'
    );
  }

  try {
    await sendNotifications({
      receiver: ride.userId,
      driverId,
      rideId: ride._id,
      text: 'Your ride is now in progress.',
      rideProgress: true,
    });
  } catch (err) {
    console.error('Notification sending failed:', err);
    // Don’t crash app — optionally just log or handle
  }

  return ride;
};

// request colose ride
const requestCloseRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride || ride.rideStatus !== 'continue') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or ride not in progress'
    );
  }

  const otp = generateOTP();

  // Save as string and mark as modified
  ride.otp = otp;
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
const completeRideWithOtp = async (rideId: string, enteredOtp: string) => {
  console.log('Verifying OTP for ride:', rideId, 'with OTP:', enteredOtp);

  // First check if ride exists and get current OTP
  const ride = await Ride.findById(rideId).select('+otp'); // Explicitly include otp

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
  const updatedRide = await Ride.findOneAndUpdate(
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
      rideId: updatedRide._id,
      receiver: updatedRide.userId,
      text: 'Ride completed successfully',
    });
  }

  console.log('Ride completed successfully:', updatedRide._id);
  return updatedRide;
};

const createRidePayment = async (payload: Partial<IPayment>) => {
  const { rideId, userId } = payload;

  // ✅ Validate input
  if (!rideId || !isValidObjectId(rideId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid rideId is required');
  }

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid userId is required');
  }

  // ✅ Fetch ride
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ride not found');
  }

  const amount = ride.fare;
  const driverId = ride.driverId;
  const method = ride.paymentMethod;

  if (!method || !['stripe', 'offline'].includes(method)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid payment method in ride'
    );
  }

  if (!driverId || !isValidObjectId(driverId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Driver info missing in ride');
  }

  if (!amount || amount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid fare amount');
  }

  // ✅ Split amount
  const adminAmount = +(amount * 0.1).toFixed(2);
  const driverAmount = +(amount * 0.9).toFixed(2);

  // ✅ Initialize payment fields
  let paymentStatus: PaymentStatus = 'paid';
  let transactionId: string | undefined;
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
              name: 'Ride Fare',
              description: `Payment for ride ID: ${rideId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://re-cycle-mart-client.vercel.app/success',
      cancel_url: 'https://re-cycle-mart-client.vercel.app/cancelled',
      metadata: {
        rideId: rideId.toString(),
        userId: userId.toString(),
        method,
        amount: amount.toString(),
      },
    });

    stripeSessionUrl = session.url ?? undefined;
    transactionId = session.id;
    paymentStatus = 'paid'; // Will confirm later from Stripe webhook
  } else {
    transactionId = `offline_txn_${Date.now()}`;
  }

  // ✅ Create payment entry
  const payment = await Payment.create({
    rideId,
    userId,
    method,
    status: paymentStatus,
    amount,
    transactionId,
    sessionUrl: stripeSessionUrl,
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

  // ✅ Update Ride.paymentStatus if payment is already paid
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
        totalAmountSpend: amount,
        totalTrip: 1,
      },
    });
  }

  return {
    payment,
    redirectUrl: stripeSessionUrl,
  };
};

export const RideService = {
  findNearestOnlineRiders,
  updateDriverLocation,
  createRideToDB,
  acceptRide,
  cancelRide,
  continueRide,
  requestCloseRide,
  completeRideWithOtp,
  createRidePayment,
};
