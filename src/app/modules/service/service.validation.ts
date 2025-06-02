import { z } from 'zod';

const createServiceZodSchema = z.object({
  body: z.object({
    name: z.enum(['car', 'emergency-car', 'rental-car']), 
  }),
});

export const ServiceValidation = {
  createServiceZodSchema,
};
