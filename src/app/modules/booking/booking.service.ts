import { Types } from 'mongoose';
import { IRideBooking } from './booking.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { RideBooking } from './booking.model';
import { CabwireModel } from '../cabwire/cabwire.model';
import { ICabwire } from '../cabwire/cabwire.interface';
import { calculateDistance } from '../../../util/calculateDistance';
import { sendNotifications } from '../../../util/notificaton';

const createRideBookingToDB = async (
  payload: Partial<IRideBooking>,
  driverObjectId: Types.ObjectId
) => {
  // ✅ Input Validation
  if (!payload.rideId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'rideId is required');
  }

  if (!payload.paymentMethod) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'paymentMethod is required');
  }

  if (!payload.seatsBooked || payload.seatsBooked <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'seatsBooked must be > 0');
  }

  // 🔍 Find Ride
  const ride = await CabwireModel.findById(payload.rideId);
  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Associated ride not found');
  }

  // ✅ Validate essential ride fields
  if (
    !ride.perKM ||
    !ride.pickupLocation ||
    !ride.dropoffLocation ||
    !ride.setAvailable
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Incomplete ride data');
  }

  // 📏 Calculate distance
  const distance = calculateDistance(ride.pickupLocation, ride.dropoffLocation);

  // 💵 Final Fare = distance × perKM × seatsBooked
  const fare = Math.round(distance * ride.perKM * payload.seatsBooked);

  // 🪑 Check seat availability
  const availableSeats = ride.setAvailable;
  if (payload.seatsBooked > availableSeats) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Only ${availableSeats} seat(s) available`
    );
  }

  // 🎯 Prepare booking data
  const bookingPayload: Partial<IRideBooking> = {
    ...payload,
    fare,
    distance,
    driverId: driverObjectId,
    rideStatus: 'accepted',
    paymentStatus: 'pending',
  };

  // ✅ Create Booking
  const booking = await RideBooking.create(bookingPayload);
  if (!booking) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Booking creation failed'
    );
  }

  // 🔄 Update ride: reduce seats & set status
  await CabwireModel.findByIdAndUpdate(payload.rideId, {
    $inc: { setAvailable: -payload.seatsBooked },
    rideStatus: 'accepted',
  });

  // 🔗 Populate ride and return
  const bookingWithRide = await RideBooking.findById(booking._id).populate(
    'rideId'
  );

  // 📡 Send Notification via Socket
  sendNotifications({
    text: 'New ride booking accepted!',
    rideId: ride._id,
    userId: driverObjectId, // This booking is linked to this driver
    receiver: driverObjectId.toString(), // For socket emit
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    status: 'accepted',
    fare,
    distance,
    duration: ride.duration,
  });
  return bookingWithRide;
};

const bookRideByUser = async (
  rideId: string,
  userId: Types.ObjectId
): Promise<ICabwire | null> => {
  const ride = await CabwireModel.findOne({
    _id: rideId,
    rideStatus: 'requested',
  });

  if (!ride) {
    throw new Error('Ride not available for booking');
  }

  // Update ride status to accepted
  ride.rideStatus = 'book';
  await ride.save();

  return ride;
};

const cancelRide = async (rideId: string, driverId: string) => {
  const ride = await CabwireModel.findById(rideId);

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
  const ride = await CabwireModel.findById(rideId);

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
  ride.rideStatus = 'continue';
  await ride.save();

  if (global.io && ride._id) {
    global.io.emit('ride-continue::', {
      rideId: ride._id,
      driverId,
    });
  }
  return ride;
};

export const RideBookingService = {
  createRideBookingToDB,
  bookRideByUser,
  cancelRide,
  continueRide,
};
