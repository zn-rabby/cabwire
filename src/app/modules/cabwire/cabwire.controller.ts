import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { CabwireService } from './cabwire.service';
import ApiError from '../../../errors/ApiError';

const createRide = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id; // auth থেকে নিলাম driverId

  if (!driverId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Unauthorized. Please log in.'
    );
  }

  // Payload থেকে driverId বাদ দিয়ে service কল করবো
  // এবং driverId আলাদাভাবে পাঠাবো
  const result = await CabwireService.createRideByDriver(req.body, driverId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Ride created successfully by driver',
    data: result,
  });
});

export const CabwireController = {
  createRide,
};
