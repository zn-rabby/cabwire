import { Router } from 'express';
import { createPayment } from './payment.controller';

const router = Router();

router.post('/', createPayment);

export const PaymentRoutes = router;
