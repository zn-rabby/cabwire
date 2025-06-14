import express from 'express';
import { createRideBooking, RideBookingController } from './booking.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  createRideBooking
);
router.patch(
  '/accept-cabwire/:rideId',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  RideBookingController.bookRide
);
router.patch(
  '/cancel-cabwire/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  RideBookingController.cancelRide
);

router.patch(
  '/continue-cabwire/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  RideBookingController.continueRide
);

export const BookingRoutes = router;
