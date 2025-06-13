import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { RideService } from './ride.service';
import ApiError from '../../../errors/ApiError';

// find nearest driver location
const findNearestOnlineRiders = catchAsync(async (req, res) => {
  const { location } = req.body;

  const result = await RideService.findNearestOnlineRiders(location);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Nearest online drivers retrieved successfully',
    data: result,
  });
});

const updateDriverLocation = catchAsync(async (req, res) => {
  const user = req.user;
  console.log('usesr=', user);

  if (!user?.id) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized user');
  }

  const { coordinates } = req.body;

  if (!coordinates) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Coordinates are required');
  }

  const result = await RideService.updateDriverLocation(user.id, {
    coordinates,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Driver location updated successfully',
    data: result,
  });
});

// ride.controller.ts
const createRide = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized. Please log in.',
    });
  }

  const ride = await RideService.createRideToDB(
    req.body,
    new mongoose.Types.ObjectId(userId)
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Ride created successfully',
    data: ride,
  });
});

const acceptRide = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const rideId = req.params.id; // note param name: "id"

  if (!driverId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized. Please log in.',
    });
  }

  if (!rideId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ride ID is required');
  }

  // Pass rideId and driverId as strings to service
  const ride = await RideService.acceptRide(rideId, driverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ride accepted successfully',
    data: ride,
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

  const ride = await RideService.cancelRide(rideId, driverId);

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

  const ride = await RideService.continueRide(rideId, driverId);

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

  const data = await RideService.requestCloseRide(rideId, driverId);

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

  const ride = await RideService.completeRideWithOtp(rideId, enteredOtp);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ride completed successfully',
    data: ride,
  });
});

export const RideController = {
  findNearestOnlineRiders,
  updateDriverLocation,
  createRide,
  acceptRide,
  cancelRide,
  continueRide,
  requestCloseRide,
  completeRideWithOtp,
};
