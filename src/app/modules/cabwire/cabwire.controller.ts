import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { CabwireService } from './cabwire.service';
import ApiError from '../../../errors/ApiError';
import { RideService } from '../ride/ride.service';

const createRide = catchAsync(async (req: Request, res: Response) => {
  const result = await CabwireService.createRideByDriver(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Ride created successfully by driver',
    data: result,
  });
});

const bookRide = catchAsync(async (req: Request, res: Response) => {
  const rideId = req.params.rideId;
  const userId = req.body.userId as string;

  const result = await CabwireService.bookRideByUser(
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

  const ride = await RideService.cancelRide(rideId, driverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ride cancelled successfully',
    data: ride,
  });
});

export const CabwireController = {
  createRide,
  bookRide,
  cancelRide,
};
