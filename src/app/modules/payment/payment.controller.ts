import { Request, Response, NextFunction } from 'express';
import {
  createOrGetStripeAccount,
  createStripeOnboardingLink,
  PaymentService,
} from './payment.service';
import catchAsync from '../../../shared/catchAsync';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';

const createCabwireOrBookingPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payment = await PaymentService.createCabwireOrBookingPayment(
      req.body
    );
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPaymentsWithDriver = catchAsync(
  async (req: Request, res: Response) => {
    const payments = await PaymentService.getAllPaymentsWithDriver();
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Driver earnings retrieved successfully',
      data: payments,
    });
  }
);

const getAllPaymentsByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;

    const data = await PaymentService.getAllPaymentsByUserId(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payments fetched successfully',
      data,
    });
  }
);

export const withdrawToStripe = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Please provide a valid withdrawal amount',
      });
    }

    const data = await PaymentService.transferToStripeAccount(userId, amount);

    res.status(StatusCodes.OK).json({
      success: true,
      message: data.message,
      data: data.transfer,
    });
  }
);

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

const checkStripeBalance = catchAsync(async (req: Request, res: Response) => {
  const { available, pending } = await PaymentService.getStripeBalance();

  console.log('🟢 Available Balance:', available);
  console.log('🟡 Pending Balance:', pending);

  res.status(200).json({
    success: true,
    message: 'Stripe balance retrieved successfully',
    data: {
      available,
      pending,
    },
  });
});

// only for dashboard
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const payments = await PaymentService.getAllPayments();
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'All payments retrieved successfully',
    data: payments,
  });
});

const getAllEarninng = catchAsync(async (req: Request, res: Response) => {
  const payments = await PaymentService.getAllEarninng(); // ঠিকভাবে সার্ভিস কল
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'All payments retrieved successfully',
    data: payments,
  });
});

const getTotalRevenue = catchAsync(async (req: Request, res: Response) => {
  const payments = await PaymentService.getTotalRevenue(); // ঠিকভাবে সার্ভিস কল
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'All payments retrieved successfully',
    data: payments,
  });
});

export const PaymentController = {
  createCabwireOrBookingPayment,
  getAllPaymentsByUserId,

  getAllPaymentsWithDriver,
  createConnectLink,
  createAccountToStripe,
  transferToDriver,
  withdrawToStripe,
  checkStripeBalance,

  // only for dashboard
  getAllPayments,
  getAllEarninng,
  getTotalRevenue,
};
