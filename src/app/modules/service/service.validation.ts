import { z } from 'zod';

const createServiceZodSchema = z.object({
  body: z.object({
    name: z.enum([
      'rental-car',
      'emergency-car-booking',
      'car-booking',
      'package-delivery',
    ]),
    // baseFare: z.number({ required_error: 'Base fare is required' }),
    // ratePerKm: z.number({ required_error: 'Rate per KM is required' }),
    // ratePerHour: z.number({ required_error: 'Rate per hour is required' }),
    // maxHours: z.number({ required_error: 'Max hours is required' }),
    // status: z.enum(['active', 'delete']).optional(),
  }),
});

export const ServiceValidation = {
  createServiceZodSchema,
};
