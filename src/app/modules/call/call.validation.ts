import { z } from 'zod';
import { Types } from 'mongoose';

// Zod schema for audio call validation
export const audioCallZodSchema = z.object({
  callerId: z.string().refine(val => Types.ObjectId.isValid(val), {
    message: 'Invalid callerId',
  }),
  receiverId: z.string().refine(val => Types.ObjectId.isValid(val), {
    message: 'Invalid receiverId',
  }),
  roomId: z.string().min(1, 'Room ID is required'),
  status: z.enum(['calling', 'accepted', 'ended', 'rejected']),
});

export const AudioCallValidations = {
  audioCallZodSchema,
};
