import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { RideService } from './ride.service';

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

// ride.controller.ts
const createRide = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  console.log(req.user);

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

export const RideController = {
  findNearestOnlineRiders,
  createRide,
};
