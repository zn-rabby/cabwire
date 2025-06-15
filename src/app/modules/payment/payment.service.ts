import { IPayment } from './payment.interface';
import { Payment } from './payment.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { isValidObjectId } from 'mongoose';
import Stripe from 'stripe';
import config from '../../../config';
import { RideBooking } from '../booking/booking.model';
import { Ride } from '../ride/ride.model';
import { User } from '../user/user.model';
import { JwtPayload } from 'jsonwebtoken';

const stripe = new Stripe(config.stripe_secret_key as string);
// const YOUR_DOMAIN = '10.0.70.163:5005'; // replace in production

export async function createOrGetStripeAccount(
  userId: string
): Promise<string> {
  const driver = await User.findById(userId);

  if (!driver) throw new Error('Driver not found');

  if (driver.role !== 'DRIVER') {
    throw new Error('Only drivers can create a Stripe account');
  }

  if (!driver.email) throw new Error('Driver email missing');
  console.log(driver, driver.email);

  if (driver.stripeAccountId) return driver.stripeAccountId;

  const account = await stripe.accounts.create({
    type: 'express',
    email: driver.email,
  });
  console.log(account);

  await User.findByIdAndUpdate(userId, { stripeAccountId: account.id });

  return account.id;
}

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

// Generate Stripe onboarding link
export async function createStripeOnboardingLink(
  stripeAccountId: string
): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: 'https://yourapp.com/reauth',
    return_url: 'https://yourapp.com/success',
    type: 'account_onboarding',
  });

  return accountLink.url;
}
// const getAllPayments = async () => {
//   const payments = await Payment.find().sort({ createdAt: -1 }); // optional: latest first
//   return payments;
// };
const getAllPayments = async () => {
  const payments = await stripe.balanceTransactions.list(); // optional: latest first
  return payments;
};

const createAccountToStripe = async (user: JwtPayload) => {
  // Check if this user exists
  const existingUser: any = await User.findById(user.id)
    .select('+accountInformation')
    .lean();
  if (existingUser?.accountInformation?.accountUrl) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You already connected your bank on Stripe.'
    );
  }

  // Create account for Canada
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'CA',
    email: user?.email,
    business_type: 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    individual: {
      first_name: existingUser?.firstName,
      last_name: existingUser?.lastName,
      email: existingUser?.email,
    },
    business_profile: {
      mcc: '7299',
      product_description: 'Freelance services on demand',
      url: 'https://yourplatform.com',
    },
  });

  if (!account) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create account.');
  }

  // Create an account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'http://10.0.80.75:6008/failed',
    return_url: 'https://10.0.80.75:6008/success',
    type: 'account_onboarding',
  });

  // Update the user account with the Stripe account ID
  const updateAccount = await User.findOneAndUpdate(
    { _id: user.id },
    { 'accountInformation.stripeAccountId': account.id },
    { new: true }
  );

  if (!updateAccount) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update account.');
  }

  return accountLink?.url; // Return the onboarding link
};

export const PaymentService = {
  createPayment,
  getAllPayments,
  createAccountToStripe,
};
