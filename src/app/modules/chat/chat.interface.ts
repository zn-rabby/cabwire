import { Document, Types, Model } from 'mongoose';

// ✅ Interface for a single Chat document
export interface IChat extends Document {
  participants: Types.ObjectId[]; // user and driver
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ ChatModel type
export type ChatModel = Model<IChat>;
