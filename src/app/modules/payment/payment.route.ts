import { Router } from 'express';
import { createConnectLink, PaymentController } from './payment.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';

const router = Router();

// only for dashbaord
router.get(
  '/total-erning',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PaymentController.getAllEarninng
);
router.get(
  '/total-revinue',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PaymentController.getTotalRevenue
);
router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PaymentController.getAllPayments
);
router.get('/check-balance', PaymentController.checkStripeBalance);

router.get(
  '/driver',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  PaymentController.getAllPaymentsWithDriver
);

router.get('/:userId', auth(), PaymentController.getAllPaymentsByUserId);
router.post('/:userId/withdraw', auth(), PaymentController.withdrawToStripe);

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
