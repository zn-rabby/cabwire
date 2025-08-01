import { Payment } from './payment.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import config from '../../../config';
import { User } from '../user/user.model';
import { JwtPayload } from 'jsonwebtoken';
import { startOfMonth, endOfMonth } from 'date-fns';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { DailyEarning } from '../earning/erning.model';
import { startOfDay } from 'date-fns';

// ========================================== extra ===================================

const stripe = new Stripe(config.stripe_secret_key as string);

// export async function createOrGetStripeAccount(
//   userId: string
// ): Promise<string> {
//   const driver = await User.findById(userId);

//   if (!driver) throw new Error('Driver not found');

//   if (driver.role !== 'DRIVER') {
//     throw new Error('Only drivers can create a Stripe account');
//   }

//   if (!driver.email) throw new Error('Driver email missing');
//   console.log(driver, driver.email);

//   if (driver.stripeAccountId) return driver.stripeAccountId;

//   const account = await stripe.accounts.create({
//     type: 'express',
//     email: driver.email,
//     capabilities: {
//       transfers: { requested: true }, // ✅ এই লাইনটা যোগ করো
//     },
//   });

//   console.log(account);

//   await User.findByIdAndUpdate(userId, { stripeAccountId: account.id });

//   return account.id;
// }

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

// ========================================== Dashboard ===================================

const getAllPayments = async (query: Record<string, unknown>) => {
  const paymentQuery = new QueryBuilder(
    Payment.find()
      .populate('userId', 'name email') // ✅ Populate user info
      .populate('rideId', 'distance duration fare paymentStatus') // ✅ Populate ride info
      .populate(
        'driverId',
        'name email driverLicense.licenseNumber driverVehicles.vehiclesMake'
      ), // ✅ Populate driver info + nested fields
    query
  )
    .search(['transactionId'])
    .filters()
    .sort('-createdAt')
    .paginate()
    .fields();

  const result = await paymentQuery.modelQuery;
  const meta = await paymentQuery.countTotal();

  return { meta, result };
};

const getAllEarninng = async () => {
  const payments = await Payment.find();

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

// ========================================== Dashboard ===================================
// ========================================== App ===================================

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

const getStripeBalance = async () => {
  const balance = await stripe.balance.retrieve();
  return {
    available: balance.available,
    pending: balance.pending,
  };
};

const getAllPaymentsWithDriver = async () => {
  const drivers = await User.find({ role: 'DRIVER' });

  const earnings = [];

  for (const driver of drivers) {
    // 🟠 Get Daily Earnings from DailyEarning model
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarning = await DailyEarning.findOne({
      driverId: driver._id,
      date: today,
    });

    const todayTotalEarning = todayEarning?.todayTotalEarning || 0;
    const cashPaymentReceived = todayEarning?.cashPaymentReceived || 0;
    const onlinePaymentReceived = todayEarning?.onlinePaymentReceived || 0;
    const walletAmount = todayEarning?.walletAmount || 0;
    const todayAvailableEarning = todayTotalEarning - walletAmount;

    // 🟢 Get total earnings from Payment model
    const allPayments = await Payment.find({
      driverId: driver._id,
      status: 'paid',
    });

    const totalOnlineEarning = allPayments
      .filter(p => p.method === 'stripe')
      .reduce((sum, p) => sum + p.driverAmount, 0);

    const totalEarnings = allPayments.reduce(
      (sum, p) => sum + p.driverAmount,
      0
    );

    earnings.push({
      driverId: driver._id,
      name: driver.name,
      todayTotalEarning,
      todayAvailableEarning,
      cashPaymentReceived,
      onlinePaymentReceived,
      walletAmount,
      totalOnlineEarning,
      totalEarnings,
      currency: 'usd',
    });
  }

  return earnings;
};

const getAllPaymentsByUserId = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID');
  }

  const objectId = new mongoose.Types.ObjectId(id);
  const now = new Date();

  const payments = await Payment.find({
    $or: [{ driverId: objectId }, { adminId: objectId }],
  });

  let totalDriverAmount = 0;
  let totalAdminAmount = 0;
  let todayEarning = 0;
  let weeklyEarning = 0;
  let monthlyEarning = 0;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  payments.forEach((payment: any) => {
    const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;
    const amount =
      payment.driverId?.toString() === id ? payment.driverAmount : 0;

    if (payment.driverId?.toString() === id) {
      totalDriverAmount += payment.driverAmount || 0;
    }

    if (payment.adminId?.toString() === id) {
      totalAdminAmount += payment.adminAmount || 0;
    }

    if (paidAt) {
      if (paidAt >= todayStart) {
        todayEarning += amount;
      }

      if (paidAt >= weekStart) {
        weeklyEarning += amount;
      }

      if (paidAt >= monthStart) {
        monthlyEarning += amount;
      }
    }
  });

  return {
    totalDriverAmount,
    totalAdminAmount,
    todayEarning,
    weeklyEarning,
    monthlyEarning,
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

  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd', // তোমার currency অনুযায়ী পরিবর্তন করো
    destination: user.stripeAccountId, // ইউজারের Stripe connected account ID
    description: `Withdraw payment for user ${userId}`,
  });

  return {
    message: 'Amount transferred to Stripe account successfully',
    transfer,
  };
};

const transferToDriver = async (payload: {
  driverId: string;
  amount: number;
}) => {
  const { driverId, amount } = payload;

  // Step 1: Get driver and check Stripe account
  const driver = await User.findById(driverId);
  if (!driver || !driver.stripeAccountId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Driver or Stripe account not found'
    );
  }

  // Step 2: Get all completed earnings for this driver
  const earnings = await Payment.find({
    driverId,
    status: 'paid',
    method: 'stripe',
    driverAmount: { $gt: 0 },
  });

  // Step 3: Sum all earned amounts from those payments
  const totalEarnings = earnings.reduce(
    (sum, p) => sum + (p.driverAmount || 0),
    0
  );

  // Step 4: Get all past withdrawals by this driver
  const withdrawals = await Payment.find({
    driverId,
    type: 'withdrawal',
  });

  const totalWithdrawn = withdrawals.reduce(
    (sum, w) => sum + (w.amount || 0),
    0
  );

  // Step 5: Calculate available balance
  const availableBalance = totalEarnings - totalWithdrawn;

  // Step 6: Check if sufficient balance exists
  if (amount > availableBalance) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Insufficient balance. Available: ${availableBalance.toFixed(2)}`
    );
  }

  // Step 7: Perform Stripe transfer
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    destination: driver.stripeAccountId,
    transfer_group: `group_driver_${driverId}`,
  });

  // Step 8: Create withdrawal payment record
  const withdrawalPayment = await Payment.create({
    driverId,
    userId: driver._id,
    amount,
    adminAmount: 0,
    driverAmount: amount,
    transferId: transfer.id,
    transferredAt: new Date(),
    type: 'withdrawal',
    status: 'paid',
    method: 'stripe',
  });

  // Step 9: Update driver's total earnings without triggering pre-save hook
  await User.findByIdAndUpdate(driverId, {
    $inc: { driverTotalEarn: -amount },
  });

  // Step 10: Update DailyEarning for today
  const today = startOfDay(new Date());

  const dailyEarning = await DailyEarning.findOneAndUpdate(
    { driverId, date: today },
    {
      $inc: {
        todayAvailableEarning: -amount,
        todayTotalEarning: 0, // No change to total earning on withdrawal
        onlinePaymentReceived: 0, // Adjust if applicable
        cashPaymentReceived: 0,
        walletAmount: 0,
      },
    },
    { upsert: true, new: true }
  );

  // Step 11: Return success and new balance
  return {
    success: true,
    message: 'Transfer successful',
    transfer,
    remainingBalance: +(availableBalance - amount).toFixed(2),
    withdrawalPayment,
    dailyEarning,
  };
};

export const PaymentService = {
  // dashbaorad
  getAllPayments,
  getAllEarninng,
  getTotalRevenue,

  // app
  createAccountToStripe,
  getStripeBalance,

  getAllPaymentsByUserId,
  getAllPaymentsWithDriver,

  transferToDriver,
  transferToStripeAccount,
};
