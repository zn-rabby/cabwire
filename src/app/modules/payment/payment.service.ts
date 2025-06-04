import { IPayment } from './payment.interface';
import { Payment } from './payment.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { isValidObjectId } from 'mongoose';
import Stripe from 'stripe';
import config from '../../../config';
import { RideBooking } from '../booking/booking.model';
import { Ride } from '../ride/ride.model';

const stripe = new Stripe(config.stripe_secret_key as string);
// const YOUR_DOMAIN = '10.0.70.163:5005'; // replace in production

const createPayment = async (payload: Partial<IPayment>) => {
  // 1️⃣ Validate required IDs
  if (!payload.rideId || !isValidObjectId(payload.rideId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid rideId is required');
  }
  if (!payload.userId || !isValidObjectId(payload.userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid userId is required');
  }
  if (!payload.method || !['stripe', 'offline'].includes(payload.method)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Valid payment method is required'
    );
  }

  // 2️⃣ Fetch ride info (assuming fare is in Ride model)
  const ride = await Ride.findById(payload.rideId);
  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ride not found');
  }

  const amount = ride.fare;
  if (!amount || amount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid fare amount');
  }

  // 3️⃣ Payment logic
  let paymentStatus: 'pending' | 'paid' | 'failed' = 'pending';
  let transactionId: string | undefined;
  let stripeSessionUrl: string | undefined;

  if (payload.method === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Ride Fare',
              description: `Payment for ride ID: ${payload.rideId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://example.com',
      cancel_url: 'https://example.com',
      metadata: {
        rideId: payload.rideId.toString(),
        userId: payload.userId.toString(),
        amount: amount.toString(),
        method: payload.method,
      },
    });

    stripeSessionUrl = session.url ?? undefined;
    transactionId = session.id;
    paymentStatus = 'pending';
  } else {
    // Offline payment
    paymentStatus = 'paid';
    transactionId = `offline_txn_${new Date().getTime()}`;
  }

  // 4️⃣ Create Payment
  const payment = await Payment.create({
    rideId: payload.rideId,
    userId: payload.userId,
    amount,
    method: payload.method,
    status: paymentStatus,
    transactionId,
    sessionUrl: stripeSessionUrl,
    paidAt: paymentStatus === 'paid' ? new Date() : undefined,
  });

  if (!payment) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Payment creation failed'
    );
  }

  return {
    payment,
    redirectUrl: stripeSessionUrl,
  };
};
// const getAllPayments = async () => {
//   const payments = await Payment.find().sort({ createdAt: -1 }); // optional: latest first
//   return payments;
// };
const getAllPayments = async () => {
  const payments = await stripe.balanceTransactions.list(); // optional: latest first
  return payments;
};

export const PaymentService = {
  createPayment,
  getAllPayments,
};
