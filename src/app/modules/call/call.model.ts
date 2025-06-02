import { Schema, model } from 'mongoose';
import { IAudioCall } from './call.interface';

const audioCallSchema = new Schema<IAudioCall>(
  {
    callerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    receiverId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    roomId: { type: String, required: true },
    status: {
      type: String,
      enum: ['calling', 'accepted', 'ended', 'rejected'],
      default: 'calling',
    },
  },
  {
    timestamps: true,
  }
);

export const AudioCall = model<IAudioCall>('AudioCall', audioCallSchema);
