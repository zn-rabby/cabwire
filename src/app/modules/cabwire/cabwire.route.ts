import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { CabwireController } from './cabwire.controller';

const router = express.Router();

router.post(
  '/create-cabwire',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  CabwireController.createRide
);

router.patch(
  '/accept-cabwire/:rideId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  CabwireController.bookRide
);
router.patch(
  '/cancel-cabwire/:id', // param name "id" must match controller
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  CabwireController.cancelRide
);

export const CabwireRoutes = router;
