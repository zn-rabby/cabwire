import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RideBookingService } from './booking.service';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import ApiError from '../../../errors/ApiError';

export const createRideBooking = catchAsync(
  async (req: Request, res: Response) => {
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
  }
);

// export const getAllRideBookings = catchAsync(
//   async (req: Request, res: Response) => {
//     const result = await RideBookingService.();
//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: 'All ride bookings fetched successfully',
//       data: result,
//     });
//   }
// );

// export const getSingleRideBooking = catchAsync(
//   async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const result = await RideBookingService.getSingleRideBookingFromDB(id);
//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: 'Ride booking fetched successfully',
//       data: result,
//     });
//   }
// );
