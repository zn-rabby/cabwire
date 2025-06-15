import { Request, Response, NextFunction } from 'express';
import {
  createOrGetStripeAccount,
  createStripeOnboardingLink,
  PaymentService,
} from './payment.service';
import catchAsync from '../../../shared/catchAsync';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';

const createRidePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payment = await PaymentService.createRidePayment(req.body);
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const payments = await PaymentService.getAllPayments();
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'All payments retrieved successfully',
    data: payments,
  });
});

export const createConnectLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const stripeAccountId = await createOrGetStripeAccount(userId);
    const url = await createStripeOnboardingLink(stripeAccountId);

    res.json({ url });
  } catch (error) {
    console.error('Stripe Connect Error:', error);
    res.status(500).json({ error: 'Stripe connect account creation failed' });
  }
};

const createAccountToStripe = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PaymentService.createAccountToStripe(req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Connected account created successfully',
      data: result,
    });
  }
);

const transferToDriver = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.transferToDriver(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Amount transferred to driver successfully',
    data: result,
  });
});
export const PaymentController = {
  createRidePayment,
  getAllPayments,
  createConnectLink,
  createAccountToStripe,
  transferToDriver,
};
