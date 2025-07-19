import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import catchAsync from '../../../shared/catchAsync';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';

// ========================================== Dashboard ===================================
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const payments = await PaymentService.getAllPayments(req.query);
  res.status(200).json({
    statusCode: 200,
    success: true,
    // meta: payments.meta,
    message: 'All payments retrieved successfully',
    data: payments,
  });
});

const getAllEarninng = catchAsync(async (req: Request, res: Response) => {
  const payments = await PaymentService.getAllEarninng();
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'All payments retrieved successfully',
    data: payments,
  });
});

const getTotalRevenue = catchAsync(async (req: Request, res: Response) => {
  const payments = await PaymentService.getTotalRevenue();
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'All payments retrieved successfully',
    data: payments,
  });
});

// ========================================== Dashboard ===================================

// ========================================== App ===================================

// create account
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
  // Dashboard
  getAllPayments,
  getAllEarninng,
  getTotalRevenue,

  // App
  createAccountToStripe,
  checkStripeBalance,

  getAllPaymentsByUserId,
  getAllPaymentsWithDriver,
  transferToDriver,
  withdrawToStripe,
};
