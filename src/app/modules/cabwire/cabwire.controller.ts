import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { CabwireService } from './cabwire.service';

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

export const CabwireController = {
  createRide,
  bookRide,
};
