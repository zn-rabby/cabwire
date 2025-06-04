import { Router } from 'express';
import { PaymentController } from './payment.controller';

const router = Router();

router.post('/', PaymentController.createPayment);
router.get('/', PaymentController.getAllPayments);

export const PaymentRoutes = router;
