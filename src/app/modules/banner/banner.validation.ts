import { z } from 'zod';

const createBannerZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    image: z.string().optional(),
  }),
});

export const BannerValidation = {
  createBannerZodSchema,
};
