import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';

const router = Router();

// ========================================== Dashboard ===================================
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
// ========================================== Dashboard ===================================

// ========================================== App ===================================

// create account
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
 

// check balance
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

// withdorw
router.post('/:userId/withdraw', auth(), PaymentController.withdrawToStripe);

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

// ========================================== App ===================================

export const PaymentRoutes = router;
