import { Schema, model } from 'mongoose';

const DailyEarningSchema = new Schema({
  driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },

  todayTotalEarning: { type: Number, default: 0 },
  cashPaymentReceived: { type: Number, default: 0 },
  onlinePaymentReceived: { type: Number, default: 0 },
  walletAmount: { type: Number, default: 0 },
  todayAvailableEarning: { type: Number, default: 0 },
});

DailyEarningSchema.index({ driverId: 1, date: 1 }, { unique: true });

export const DailyEarning = model('earning', DailyEarningSchema);
