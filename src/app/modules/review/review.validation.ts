import { z } from 'zod';

export const reviewZodSchema = z.object({
  body: z.object({
    serviceType: z.enum(['Ride', 'Cabwire', 'Package'], {
      required_error: 'Service type is required',
    }),
    serviceId: z.string().min(1, { message: 'Service ID is required' }),
    comment: z
      .string({ required_error: 'Comment is required' })
      .min(1, { message: 'Comment cannot be empty' }),
    rating: z
      .number({ required_error: 'Rating is required' })
      .int({ message: 'Rating must be an integer' })
      .min(1, { message: 'Rating must be at least 1' })
      .max(5, { message: 'Rating must be at most 5' }),
  }),
});
