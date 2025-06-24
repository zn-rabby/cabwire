import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import { PackageService } from './package.service';
import ApiError from '../../../errors/ApiError';

const createPackage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const created = await PackageService.createPackageToDB(
    req.body,
    new mongoose.Types.ObjectId(userId)
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Package request created successfully',
    data: created,
  });
});

const acceptPackage = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const packageId = req.params.packageId;

  if (!driverId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const accepted = await PackageService.acceptPackageByDriver(
    packageId,
    new mongoose.Types.ObjectId(driverId)
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Package accepted successfully',
    data: accepted,
  });
});

const continuePackage = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const packageId = req.params.packageId;

  if (!driverId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const updated = await PackageService.continuePackageDeliver(
    packageId,
    Types.ObjectId.createFromHexString(driverId)
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Package status updated to continue',
    data: updated,
  });
});

const markAsDelivered = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const packageId = req.params.packageId;

  if (!driverId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const updated = await PackageService.markPackageAsDelivered(
    packageId,
    new mongoose.Types.ObjectId(driverId)
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Package marked as delivered',
    data: updated,
  });
});

const requestClosePackage = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.user?.id;
  const rideId = req.params.id;

  if (!driverId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const data = await PackageService.requestClosePackage(rideId, driverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP generated successfully',
    data,
  });
});

const completePackageeWithOtp = catchAsync(
  async (req: Request, res: Response) => {
    const { rideId, otp } = req.body;

    // Validate input
    if (!rideId || otp === undefined || otp === '') {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Ride ID and OTP are required'
      );
    }

    // Convert otp to string (don't convert to number)
    const enteredOtp = otp.toString();

    const ride = await PackageService.completePackageWithOtp(
      rideId,
      enteredOtp
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Package delivered successfully',
      data: ride,
    });
  }
);

export const PackageController = {
  createPackage,
  acceptPackage,
  continuePackage,
  markAsDelivered,
  requestClosePackage,
  completePackageeWithOtp,
};
