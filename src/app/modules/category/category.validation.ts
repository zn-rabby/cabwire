import { z } from 'zod';

const validCategoryNames = ['economy', 'premium', 'luxury'] as const;
const validStatus = ['active', 'block'] as const;

const createCategoryZodSchema = z.object({
  body: z.object({
    categoryName: z.enum(validCategoryNames, {
      errorMap: (issue, ctx) => {
        if (issue.code === 'invalid_enum_value') {
          return {
            message: `Invalid categoryName '${
              ctx.data
            }'. Expected categoryName of: ${validCategoryNames.join(', ')}`,
          };
        }
        return { message: ctx.defaultError };
      },
    }),
    image: z.string({
      required_error: 'Image is required',
      invalid_type_error: 'Image must be a string',
    }),
    basePrice: z.number({
      required_error: 'basePrice is required',
      invalid_type_error: 'basePrice must be a number',
    }),
    ratePerKm: z.number().optional(),
    ratePerHour: z.number().optional(),
    status: z.enum(validStatus).optional(),
  }),
});

export const CategoryValidation = {
  createCategoryZodSchema,
};
