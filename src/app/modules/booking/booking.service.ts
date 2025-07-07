import { Types } from 'mongoose';
import { IRideBooking } from './booking.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { RideBooking } from './booking.model';
import { CabwireModel } from '../cabwire/cabwire.model';
import { calculateDistance } from '../../../util/calculateDistance';
import { sendNotifications } from '../../../util/notificaton';
import generateOTP from '../../../util/generateOTP';

const createRideBookingToDB = async (
  payload: Partial<IRideBooking>,
  userObjectId: Types.ObjectId // auth থেকে passenger userId
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

  // রাইড ডাটাবেজ থেকে ফেচ করুন
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

  // এখানে driverId আসবে ride.driverId থেকে
  const driverId = ride.driverId;

  // Booking data প্রস্তুত করুন
  const bookingPayload: Partial<IRideBooking> = {
    ...payload,
    fare,
    distance,
    userId: userObjectId, // auth থেকে passenger
    driverId, // ride.driverId থেকে ড্রাইভার
    rideStatus: 'accepted',
    paymentStatus: 'pending',
  };

  // Booking তৈরি করুন
  const booking = await RideBooking.create(bookingPayload);
  if (!booking) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Booking creation failed'
    );
  }

  // Ride এর seat কমান এবং status আপডেট করুন
  await CabwireModel.findByIdAndUpdate(payload.rideId, {
    $inc: { setAvailable: -payload.seatsBooked },
    rideStatus: 'accepted',
  });

  // Booking এ ride populate করুন
  const bookingWithRide = await RideBooking.findById(booking._id).populate(
    'rideId'
  );

  // Notification পাঠান ড্রাইভারকে
  sendNotifications({
    text: 'New ride booking accepted!',
    rideId: ride._id,
    userId: driverId?.toString(), // ড্রাইভারকে জানানো হচ্ছে
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
      'Invalid ride or already continue'
    );
  }

  ride.rideStatus = 'continue';
  await ride.save();

  if (ride._id) {
    sendNotifications({
      text: 'Your Cabwire ride is now in continue!',
      receiver: ride._id, // For socket emit
      rideId: ride._id,
      driverId,
    });
  }
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

export const RideBookingService = {
  createRideBookingToDB,
  cancelRide,
  continueRide,
  requestCloseRide,
  completeRideWithOtp,
};
