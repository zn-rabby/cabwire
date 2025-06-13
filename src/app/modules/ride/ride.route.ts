import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { RideController } from './ride.controller';

const router = express.Router();

router.post('/nearest-driver', RideController.findNearestOnlineRiders);
router.patch(
  '/update-driver-location',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.DRIVER,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN
  ),
  RideController.updateDriverLocation
);
router
  .route('/create-ride')
  .post(
    auth(
      USER_ROLES.ADMIN,
      USER_ROLES.DRIVER,
      USER_ROLES.USER,
      USER_ROLES.SUPER_ADMIN
    ),
    RideController.createRide
  );

router.patch(
  '/accept-ride-driver/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER),
  RideController.acceptRide
);

router.patch(
  '/cancel-ride-driver/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  RideController.cancelRide
);

router.patch(
  '/continue-ride-driver/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  RideController.continueRide
);

router.patch(
  '/request-close-ride/:id',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.DRIVER,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN
  ),
  RideController.requestCloseRide
);

router.post(
  '/verify-ride-otp/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  RideController.completeRideWithOtp
);

export const RideRoutes = router;
