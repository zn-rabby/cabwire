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
import { sendNotifications } from '../../../util/notificaton';

// import { OnlineDriverStore } from '../../../util/OnlineDriverStore';

// type UserDocument = Document & IUser;

// export const getOnlineDriversFromStore = (): {
//   driverId: string;
//   socketId: string;
// }[] => {
//   return OnlineDriverStore.getDrivers();
// };

// export const setDriverOnline = async (
//   driverId: string,
//   socketId: string
// ): Promise<void> => {
//   OnlineDriverStore.addDriver(driverId, socketId);
//   await User.findByIdAndUpdate(driverId, { isOnline: true });
// };

// export const removeDriverOnline = async (socketId: string): Promise<void> => {
//   const driver = OnlineDriverStore.getDrivers().find(
//     d => d.socketId === socketId
//   );
//   if (driver) {
//     await User.findByIdAndUpdate(driver.driverId, { isOnline: false });
//   }
//   OnlineDriverStore.removeBySocket(socketId);
// };

// export const getOnlineDriversFromDB = async (): Promise<UserDocument[]> => {
//   try {
//     const drivers = await User.find({
//       role: 'driver',
//       isOnline: true,
//     });
//     return drivers;
//   } catch (error) {
//     console.error('Error fetching online drivers:', error);
//     throw error;
//   }
// };

// find nearest riders
// export const findNearestOnlineRiders = async (location: {
//   lat?: number;
//   lng?: number;
// }) => {
//   if (
//     !location ||
//     typeof location.lat !== 'number' ||
//     typeof location.lng !== 'number'
//   ) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or missing lat/lng');
//   }

//   const coordinates: [number, number] = [location.lng, location.lat]; // GeoJSON expects [lng, lat]

//   const result = await User.find({
//     role: 'DRIVER',
//     // isOnline: true,
//     'geoLocation.coordinates': { $ne: [0, 0] },
//     geoLocation: {
//       $near: {
//         $geometry: {
//           type: 'Point',
//           coordinates,
//         },
//         $maxDistance: 5000, // 5 km radius
//       },
//     },
//   });

//   return result;
// };

// find nearest riders
const findNearestOnlineRiders = async (location: {
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
        $maxDistance: 5000, // 5 km radius
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
  console.log('nearsest drivers=', nearestDrivers);

  if (!nearestDrivers.length) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No available drivers near your pickup location.'
    );
  }

  // Emit socket events to each driver room
  const io = global.io;

  if (ride?._id) {
    nearestDrivers.forEach(driver => {
      console.log(44, driver?._id);
      sendNotifications({
        text: 'Ride created successfully',
        rideId: ride._id,
        userId: ride.userId,
        receiver: driver?._id, // socket emit এই receiver আইডিতে হবে
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
        status: ride.rideStatus,
        fare: ride.fare,
        distance: ride.distance,
        duration: ride.duration,
        event: 'ride-requested', // custom event name
      });
    });
  }

  return ride;
};

// accept ride
const acceptRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);
  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already accepted'
    );
  }
  // Atomic update check
  const updatedRide = await Ride.findOneAndUpdate(
    { _id: rideId, rideStatus: 'requested' },
    {
      driverId: new Types.ObjectId(driverId),
      rideStatus: 'accepted',
    },
    { new: true }
  );

  if (!updatedRide) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Ride has already been accepted by another driver.'
    );
  }
  if (updatedRide._id) {
    sendNotifications({
      receiver: updatedRide._id,
      driverId,
      text: 'Ride accept successsfully',
    });
  }
  return updatedRide;
};

// cancel ride
const cancelRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already cancelled'
    );
  }

  // Update status
  ride.rideStatus = 'cancelled';
  await ride.save();

  // Emit ride-cancelled event
  if (ride._id) {
    sendNotifications({
      receiver: ride._id,
      driverId,
      text: 'Cancel ride successsfully',
    });
  }

  return ride;
};

// continue ride
const continueRide = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);

  if (!ride || ride.rideStatus !== 'requested') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid ride or already continue'
    );
  }

  ride.rideStatus = 'continue';
  await ride.save();

  if (ride._id) {
    sendNotifications({
      receiver: ride._id,
      driverId,
      text: 'Continue ride successsfully',
    });
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
      // event: 'ride-completed',
      rideId: updatedRide._id,
      receiver: updatedRide._id,
      text: 'Ride completed successfully',
    });
  }

  console.log('Ride completed successfully:', updatedRide._id);
  return updatedRide;
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
};
