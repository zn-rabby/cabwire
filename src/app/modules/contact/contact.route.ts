import express from 'express';
import { contactUsController } from './contact.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const ContactUsRoutes = express.Router();

ContactUsRoutes.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  // validateRequest(inquiryValidations.verifyInquiryZodSchema),
  contactUsController.createContactUs
).get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  contactUsController.getAllContactUs
);

export default ContactUsRoutes;
