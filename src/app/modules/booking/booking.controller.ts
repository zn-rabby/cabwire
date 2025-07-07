import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RideBookingService } from './booking.service';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';

const createRideBooking = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // auth থেকে

  if (!userId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Unauthorized. Please log in.'
    );
  }

  const result = await RideBookingService.createRideBookingToDB(
    req.body,
    new mongoose.Types.ObjectId(userId) // auth থেকে passenger userId
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Ride booking created successfully',
    data: result,
  });
});

const cancelRide = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const rideId = req.params.id;

  if (!driverId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized. Please log in.',
    });
  }

  if (!rideId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride ID is required');
  }

  const ride = await RideBookingService.cancelRide(rideId, driverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ride cancelled successfully',
    data: ride,
  });
});

const continueRide = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const rideId = req.params.id;

  if (!driverId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized. Please log in.',
    });
  }

  if (!rideId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride ID is required');
  }

  const ride = await RideBookingService.continueRide(rideId, driverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ride continue successfully',
    data: ride,
  });
});

const requestCloseRide = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const rideId = req.params.id;

  if (!driverId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const data = await RideBookingService.requestCloseRide(rideId, driverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP generated successfully',
    data,
  });
});

const completeRideWithOtp = catchAsync(async (req: Request, res: Response) => {
  const { rideId, otp } = req.body;

  // Validate input
  if (!rideId || otp === undefined || otp === '') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride ID and OTP are required');
  }

  // Convert otp to string (don't convert to number)
  const enteredOtp = otp.toString();

  const ride = await RideBookingService.completeRideWithOtp(rideId, enteredOtp);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ride completed successfully',
    data: ride,
  });
});

const createCabwireOrBookingPayment = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
    }

    const { rideId, method } = req.body;

    if (!rideId || !method) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'rideId and method are required'
      );
    }

    const payment = await RideBookingService.createCabwireOrBookingPayment({
      sourceId: rideId,
      userId,
      method,
    });

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Cabwire Payment created successfully',
      data: payment,
    });
  }
);

export const RideBookingController = {
  createRideBooking,
  cancelRide,
  continueRide,
  requestCloseRide,
  completeRideWithOtp,
  createCabwireOrBookingPayment,
};
