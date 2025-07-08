import { z } from 'zod';

const validServiceNames = [
  'car',
  'emergency-car',
  'rental-car',
  'cabwire-share',
  'package',
] as const;

const createServiceZodSchema = z.object({
  body: z.object({
    serviceName: z.enum(validServiceNames, {
      errorMap: (issue, ctx) => {
        if (issue.code === 'invalid_enum_value') {
          const provided = ctx.data;
          const expected = validServiceNames.join(', ');
          return {
            message: `Your Service Name: '${provided}'. Expected Service Name: ${expected}.`,
          };
        }

        return { message: ctx.defaultError };
      },
    }),
  }),
});
const updateServiceZodSchema = z.object({
  body: z.object({
    serviceName: z
      .enum(validServiceNames, {
        errorMap: (issue, ctx) => {
          if (issue.code === 'invalid_enum_value') {
            const provided = ctx.data;
            const expected = validServiceNames.join(', ');
            return {
              message: `Your Service Name: '${provided}'. Expected Service Name: ${expected}.`,
            };
          }

          return { message: ctx.defaultError };
        },
      })
      .optional(), // ✅ Make it optional for update
  }),
});

export const ServiceValidation = {
  createServiceZodSchema,
  updateServiceZodSchema,
};
