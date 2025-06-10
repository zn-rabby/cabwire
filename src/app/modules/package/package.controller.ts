import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { PackageService } from './package.service';

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

export const PackageController = {
  createPackage,
  acceptPackage,
  markAsDelivered,
};
