import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MessageController } from './message.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
const router = express.Router();

router.post(
  '/',
  fileUploadHandler(),
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.DRIVER
  ),
  MessageController.sendMessage
);
router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.DRIVER
  ),
  MessageController.getMessage
);

export const MessageRoutes = router;
