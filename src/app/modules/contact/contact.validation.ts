import { z } from 'zod';
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const verifyInquiryZodSchema = z.object({
  body: z.object({
    productId: z
      .string()
      .regex(objectIdRegex, { message: 'productId categoryId format' }),
    fullName: z.string({ required_error: 'fullName is required' }),
    email: z.string({ required_error: 'email is required' }),
    countryCode: z.string({ required_error: 'countryCode is required' }),
    phone: z.string({ required_error: 'phone is required' }),
    description: z.string({ required_error: 'description is required' }),
  }),
});

export const inquiryValidations = {
  verifyInquiryZodSchema,
};
