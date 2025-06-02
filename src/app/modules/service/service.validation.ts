import { z } from 'zod';

const createServiceZodSchema = z.object({
  body: z.object({
    serviceName: z.enum(['car', 'emergency-car', 'rental-car']),
  }),
});

export const ServiceValidation = {
  createServiceZodSchema,
};
