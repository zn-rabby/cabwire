import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RuleService } from './rule.service';

//privacy policy
const createPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  const { ...privacyData } = req.body;
  const result = await RuleService.createPrivacyPolicyToDB(privacyData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Privacy policy created successfully',
    data: result,
  });
});

const getPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
  // get 'for' from query params, default to 'user' if not provided
  const targetFor = (req.query.for as 'user' | 'driver') || 'user';

  const result = await RuleService.getPrivacyPolicyFromDB(targetFor);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Privacy policy for ${targetFor} retrieved successfully`,
    data: result,
  });
});

//terms and conditions
const createTermsAndCondition = catchAsync(
  async (req: Request, res: Response) => {
    const { ...termsData } = req.body;
    const result = await RuleService.createTermsAndConditionToDB(termsData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Terms and conditions created successfully',
      data: result,
    });
  }
);

const getTermsAndCondition = catchAsync(async (req: Request, res: Response) => {
  const targetFor = (req.query.for as 'user' | 'driver') || 'user';

  const result = await RuleService.getTermsAndConditionFromDB(targetFor);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Terms and conditions for ${targetFor} retrieved successfully`,
    data: result,
  });
});

//about
const createAbout = catchAsync(async (req: Request, res: Response) => {
  const { ...aboutData } = req.body;
  const result = await RuleService.createAboutToDB(aboutData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'About created successfully',
    data: result,
  });
});

const getAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await RuleService.getAboutFromDB();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'About retrieved successfully',
    data: result,
  });
});

export const RuleController = {
  createPrivacyPolicy,
  getPrivacyPolicy,
  createTermsAndCondition,
  getTermsAndCondition,
  createAbout,
  getAbout,
};
