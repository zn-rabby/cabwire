import { IPayment } from './payment.interface';
import { Payment } from './payment.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { isValidObjectId } from 'mongoose';
import Stripe from 'stripe';
import config from '../../../config';
import { RideBooking } from '../booking/booking.model';

const stripe = new Stripe(config.stripe_secret_key as string);
// const YOUR_DOMAIN = '10.0.70.163:5005'; // replace in production

const createPayment = async (payload: Partial<IPayment>) => {
  // 1️⃣ Validate required IDs
  if (!payload.bookingId || !isValidObjectId(payload.bookingId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid bookingId is required');
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

  // 2️⃣ Fetch booking to get fare and rideId
  const booking = await RideBooking.findById(payload.bookingId);
  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found');
  }

  const amount = booking.fare;
  if (!amount || amount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid fare amount');
  }

  const rideId = booking.rideId;

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
              description: `Payment for ride ID: ${rideId}`,
              metadata: {
                rideId: rideId.toString(),
                userId: payload.userId.toString(),
              },
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://example.com',
      cancel_url: 'https://example.com',
      metadata: {
        rideId: rideId.toString(),
        userId: payload.userId.toString(),
        bookingId: payload.bookingId.toString(),
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
    rideId,
    userId: payload.userId,
    bookingId: payload.bookingId,
    amount,
    method: payload.method,
    status: paymentStatus,
    transactionId,
    sessionUrl: stripeSessionUrl,
    paidAt: paymentStatus === 'paid' ? new Date() : undefined,
  });
  console.log('dd', payment);
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

export const PaymentService = {
  createPayment,
};
