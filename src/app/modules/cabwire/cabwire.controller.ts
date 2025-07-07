import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
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

export const CabwireController = {
  createRide,
};
