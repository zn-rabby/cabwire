import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { CabwireController } from './cabwire.controller';

const router = express.Router();

router.post(
  '/create',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  CabwireController.createRide
);

router.patch(
  '/book/:rideId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  CabwireController.bookRide
);

export const CabwireRoutes = router;
