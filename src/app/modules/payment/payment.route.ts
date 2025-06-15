import { Router } from 'express';
import { createConnectLink, PaymentController } from './payment.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';

const router = Router();

router.post('/ride-payment', PaymentController.createRidePayment);
router.post('/cabwire-payment', PaymentController.createCabwireOrBookingPayment);
router.get('/', PaymentController.getAllPayments);

// connect stripe account
router.post('/create-connect-link', auth(USER_ROLES.DRIVER), createConnectLink);
router.post(
  '/create-account',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  PaymentController.createAccountToStripe
);

router.post(
  '/transfer-to-driver',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  PaymentController.transferToDriver
);

export const PaymentRoutes = router;
