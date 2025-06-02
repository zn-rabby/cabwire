import { Types } from 'mongoose';

export interface IAudioCall {
  callerId: Types.ObjectId;
  receiverId: Types.ObjectId;
  roomId: string;
  status: 'calling' | 'accepted' | 'ended' | 'rejected';
}
