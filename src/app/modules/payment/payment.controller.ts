import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import catchAsync from '../../../shared/catchAsync';

const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payment = await PaymentService.createPayment(req.body);
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

export const PaymentController = { createPayment, getAllPayments };
