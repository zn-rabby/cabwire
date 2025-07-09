import { model, Schema } from 'mongoose';
import { TContactUs } from './contact.interface';

const contactUsSchema = new Schema<TContactUs>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ContactUs = model<TContactUs>('ContactUs', contactUsSchema);
