import { Router } from 'express';
import { createConnectLink, PaymentController } from './payment.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';

const router = Router();

router.post('/', PaymentController.createPayment);
router.get('/', PaymentController.getAllPayments);

// connect stripe account
router.post('/create-connect-link', auth(USER_ROLES.DRIVER), createConnectLink);

export const PaymentRoutes = router;
