import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RideBookingService } from './booking.service';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';

const createRideBooking = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;

  if (!driverId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Unauthorized. Please log in.'
    );
  }

  const result = await RideBookingService.createRideBookingToDB(
    req.body,
    new mongoose.Types.ObjectId(driverId)
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Ride booking created successfully',
    data: result,
  });
});

const bookRide = catchAsync(async (req: Request, res: Response) => {
  const rideId = req.params.rideId;
  const userId = req.body.userId as string;

  const result = await RideBookingService.bookRideByUser(
    rideId,
    new Types.ObjectId(userId)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Ride booked successfully by user',
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

export const RideBookingController = {
  createRideBooking,
  bookRide,
  cancelRide,
  continueRide,
};
