import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { RideController } from './ride.controller';

const router = express.Router();

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

router.post('/nearest-driver', RideController.findNearestOnlineRiders);
router.patch(
  '/accept-ride-driver/:id', // param name "id" matches controller
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER),
  RideController.acceptRide
);

router.patch(
  '/cancel-ride-driver/:id', // param name "id" must match controller
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  RideController.cancelRide
);
router.patch(
  '/continue-ride-driver/:id', // param name "id" must match controller
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.USER),
  RideController.continueRide
);

export const RideRoutes = router;
