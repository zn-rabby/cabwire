import { IPayment } from './payment.interface';
import { Payment } from './payment.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { isValidObjectId } from 'mongoose';
import Stripe from 'stripe';
import config from '../../../config';
import { Ride } from '../ride/ride.model';
import { User } from '../user/user.model';
import { JwtPayload } from 'jsonwebtoken';
import { CabwireModel } from '../cabwire/cabwire.model';
import { RideBooking } from '../booking/booking.model';
import { PackageModel } from '../package/package.model';
import { startOfMonth, endOfMonth } from 'date-fns';
import mongoose from 'mongoose';
import { PaymentStatus } from '../ride/ride.interface';

const stripe = new Stripe(config.stripe_secret_key as string);
// // const YOUR_DOMAIN = '10.0.70.163:5005'; // replace in production



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
    capabilities: {
      transfers: { requested: true }, // ✅ এই লাইনটা যোগ করো
    },
  });

  console.log(account);

  await User.findByIdAndUpdate(userId, { stripeAccountId: account.id });

  return account.id;
}


const createCabwireOrBookingPayment = async (payload: {
  sourceId: string;
  userId: string;
  method: 'stripe' | 'offline';
  sourceType: 'cabwire' | 'ride-booking';
}) => {
  const { sourceId, userId, method, sourceType } = payload;

  if (!isValidObjectId(sourceId) || !isValidObjectId(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid IDs are required');
  }

  if (!['stripe', 'offline'].includes(method)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payment method');
  }

  // Fetch source (ride or ride-booking)
  let fare: number = 0;
  let driverId: string;

  if (sourceType === 'cabwire') {
    const ride = await CabwireModel.findById(sourceId);
    if (!ride) throw new ApiError(StatusCodes.NOT_FOUND, 'Ride not found');
    if (typeof ride.fare !== 'number' || !ride.driverId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ride data');
    }
    fare = ride.fare;
    driverId = ride.driverId.toString();
  } else {
    const booking = await RideBooking.findById(sourceId);
    if (!booking)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found');
    if (typeof booking.fare !== 'number' || !booking.driverId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid booking data');
    }
    fare = booking.fare;
    driverId = booking.driverId.toString();
  }

  if (!fare || fare <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid fare');
  }

  // Calculate 90% for driver, 10% for admin
  const driverAmount = parseFloat((fare * 0.9).toFixed(2));
  const adminAmount = parseFloat((fare * 0.1).toFixed(2));
  const adminId = '683d770e4a6d774b3e65fb8e'; // Fixed Admin ID

  let transactionId: string | undefined;
  let stripeSessionUrl: string | undefined;
  let status: 'pending' | 'paid' | 'failed' = 'pending';

  if (method === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Ride Payment',
              description: `Payment for ${sourceType} ID: ${sourceId}`,
            },
            unit_amount: Math.round(fare * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: { sourceId, userId, method, sourceType },
    });

    transactionId = session.id;
    stripeSessionUrl = session.url ?? undefined;
    status = 'pending';
  } else {
    transactionId = `offline_${Date.now()}`;
    status = 'paid';
  }

  const payment = await Payment.create({
    rideId: sourceType === 'cabwire' ? sourceId : undefined,
    rideBookingId: sourceType === 'ride-booking' ? sourceId : undefined,
    userId,
    driverId,
    adminId,
    method,
    status,
    transactionId,
    sessionUrl: stripeSessionUrl,
    amount: fare,
    driverAmount,
    adminAmount,
    paidAt: status === 'paid' ? new Date() : undefined,
  });

  return {
    payment,
    redirectUrl: stripeSessionUrl,
  };
};

// payment.service.ts
const createPackagePayment = async (payload: {
  packageId: string;
  userId: string;
  method: 'stripe' | 'offline';
}) => {
  const { packageId, userId, method } = payload;

  if (!isValidObjectId(packageId) || !isValidObjectId(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid IDs are required');
  }

  if (!['stripe', 'offline'].includes(method)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payment method');
  }

  const pkg = await PackageModel.findById(packageId);
  if (!pkg) throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');

  const fare = pkg.fare;
  if (typeof fare !== 'number' || fare <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid fare in package');
  }

  // Commission calculation
  const adminId = '683d770e4a6d774b3e65fb8e';
  const driverId = pkg.driverId?.toString();
  if (!driverId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Driver ID is missing in package'
    );
  }

  const adminAmount = Number((fare * 0.1).toFixed(2));
  const driverAmount = Number((fare * 0.9).toFixed(2));

  let transactionId: string | undefined;
  let stripeSessionUrl: string | undefined;
  let status: 'pending' | 'paid' | 'failed' = 'pending';

  if (method === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Package Delivery Payment',
              description: `Payment for Package ID: ${packageId}`,
            },
            unit_amount: Math.round(fare * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: { packageId, userId, method, sourceType: 'package' },
    });

    transactionId = session.id;
    stripeSessionUrl = session.url ?? undefined;
    status = 'pending';
  } else {
    transactionId = `offline_${Date.now()}`;
    status = 'paid';
  }

  const payment = await Payment.create({
    packageId,
    userId,
    method,
    status,
    transactionId,
    sessionUrl: stripeSessionUrl,
    amount: fare,
    paidAt: status === 'paid' ? new Date() : undefined,
    adminId,
    driverId,
    adminAmount,
    driverAmount,
  });

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
//   const payments = await stripe.balanceTransactions.list(); // optional: latest first
//   return payments;
// };

const getAllPaymentsWithDriver = async () => {
  // Step 1: Get all drivers with stripeAccountId
  const drivers = await User.find({
    role: 'DRIVER',
    stripeAccountId: { $exists: true },
  });

  const earnings = [];

  for (const driver of drivers) {
    // Step 2: Fetch balance transactions for each driver
    const transactions = await stripe.balanceTransactions.list(
      { limit: 100 }, // ✅ first param: filter options
      { stripeAccount: driver.stripeAccountId } // ✅ second param: request options
    );

    // Step 3: Sum the amounts
    const totalEarning = transactions.data.reduce((sum, tx) => {
      return sum + tx.amount; // amount is in cents
    }, 0);

    earnings.push({
      driverId: driver._id,
      name: driver.name,
      totalEarning: totalEarning / 100, // convert cents to dollar/taka
      currency: transactions.data[0]?.currency || 'usd',
    });
  }

  return earnings;
};

const getAllPaymentsByUserId = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID');
  }

  const objectId = new mongoose.Types.ObjectId(id);

  // Find payments where the driverId or adminId matches the provided ID
  const payments = await Payment.find({
    $or: [{ driverId: objectId }, { adminId: objectId }],
  });

  let totalDriverAmount = 0;
  let totalAdminAmount = 0;

  // Calculate respective amounts
  payments.forEach((payment: any) => {
    if (payment.driverId?.toString() === id) {
      totalDriverAmount += payment.driverAmount || 0;
    }

    if (payment.adminId?.toString() === id) {
      totalAdminAmount += payment.adminAmount || 0;
    }
  });

  return {
    totalDriverAmount,
    totalAdminAmount,
    payments,
  };
};

export const transferToStripeAccount = async (
  userId: string,
  amount: number
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid User ID');
  }
  if (amount <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Amount must be greater than zero'
    );
  }

  // ইউজার খুঁজে নাও
  // const user = await User.findById(userId);
  const user = await User.findById(userId).select('+stripeAccountId');

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  console.log('User ', user);
  console.log('User ', user.stripeAccountId);

  if (!user.stripeAccountId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'User has no Stripe Account connected'
    );
  }

  // ইউজারের পেমেন্টস গুলো নিয়ে আসো
  const { totalDriverAmount, totalAdminAmount } = await getAllPaymentsByUserId(
    userId
  );
  const availableAmount = totalDriverAmount + totalAdminAmount;

  if (amount > availableAmount) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Insufficient balance for withdrawal'
    );
  }

  // Stripe payout logic (Direct Transfer to Connected Account)
  // নিচে `stripe.transfers.create` ইউজারকে টাকা পাঠাবে
  // amount-টা cents এ দিতে হবে, তাই multiply 100 করলাম

  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd', // তোমার currency অনুযায়ী পরিবর্তন করো
    destination: user.stripeAccountId, // ইউজারের Stripe connected account ID
    description: `Withdraw payment for user ${userId}`,
  });

  // এখানে চাইলে Payment অথবা Withdraw collection আপডেট করো
  // উদাহরণ: withdraw রেকর্ড add করা বা Payment status update

  return {
    message: 'Amount transferred to Stripe account successfully',
    transfer,
  };
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

const transferToDriver = async (payload: {
  driverId: string;
  amount: number;
}) => {
  const { driverId, amount } = payload;

  const driver = await User.findById(driverId);
  console.log(driver);
  if (!driver || !driver.stripeAccountId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Driver or Stripe account not found'
    );
  }

  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    destination: driver.stripeAccountId,
    transfer_group: `group_driver_${driverId}`,
  });

  return transfer;
};

const getStripeBalance = async () => {
  const balance = await stripe.balance.retrieve();
  return {
    available: balance.available,
    pending: balance.pending,
  };
};

// only for dasboard
const getAllPayments = async () => {
  const payments = await Payment.find().sort({ createdAt: -1 }); // optional: latest first
  return payments;
};

const getAllEarninng = async () => {
  const payments = await Payment.find(); // 🔄 সব পেমেন্ট আনো, status বাদ

  let totalAmount = 0;
  let totalDriverAmount = 0;
  let totalAdminAmount = 0;

  for (const payment of payments) {
    totalAmount += Number(payment.amount || 0);
    totalDriverAmount += Number(payment.driverAmount || 0);
    totalAdminAmount += Number(payment.adminAmount || 0);
  }

  return {
    totalAmount: totalAmount.toFixed(2),
    totalDriverAmount: totalDriverAmount.toFixed(2),
    totalAdminAmount: totalAdminAmount.toFixed(2),
  };
};

const getTotalRevenue = async () => {
  const currentYear = new Date().getFullYear();
  const monthlyRevenue: { month: string; amount: number }[] = [];

  for (let month = 0; month < 12; month++) {
    const start = startOfMonth(new Date(currentYear, month, 1));
    const end = endOfMonth(new Date(currentYear, month, 1));

    // 🔍 Optional: remove status filter if your test data doesn't include 'success'
    const payments = await Payment.find({
      createdAt: { $gte: start, $lte: end },
      // status: 'success',
    });

    const total = payments.reduce((sum, payment) => {
      return sum + Number(payment.amount || 0);
    }, 0);

    monthlyRevenue.push({
      month: start.toLocaleString('default', { month: 'short' }), // 'Jan', 'Feb', etc.
      amount: parseFloat(total.toFixed(2)),
    });
  }

  return monthlyRevenue;
};

export const PaymentService = {
  createRidePayment,
  createCabwireOrBookingPayment,
  createPackagePayment,

  getAllPaymentsByUserId,
  getAllPaymentsWithDriver,
  createAccountToStripe,
  transferToDriver,
  transferToStripeAccount,
  getStripeBalance,

  // only for dashbaorad
  getAllPayments,
  getAllEarninng,
  getTotalRevenue,
};
