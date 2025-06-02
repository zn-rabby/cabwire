import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';

export const createPayment = async (
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

export const PaymentController = { createPayment };
