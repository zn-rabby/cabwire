import express from 'express';
import {
  createRideBooking,
} from './booking.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  createRideBooking
);
// router.get('/', getAllRideBookings);
// router.get('/:id', getSingleRideBooking);

export const BookingRoutes = router;
