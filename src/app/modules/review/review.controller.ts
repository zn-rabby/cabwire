import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { ReviewService } from './review.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const payload = {
    user: req.user.id,
    ...req.body,
  };
  const result = await ReviewService.createReviewToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Review Created Successfully',
    data: result,
  });
});

const getReview = catchAsync(async (req, res) => {
  const result = await ReviewService.getReviewFromDB(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Review Retrieved Successfully',
    data: result,
  });
});

const getReviews = catchAsync(async (req: Request, res: Response) => {
  const serviceId = req.params.serviceId;
  const result = await ReviewService.getReviewsFromDB(serviceId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Successfully retrieved all reviews for the selected service',
    data: result,
  });
});

export const ReviewController = { createReview, getReview, getReviews };
