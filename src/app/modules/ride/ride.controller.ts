import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { RideService } from './ride.service';

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
  createRide,
};
