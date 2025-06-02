import express from 'express';

import auth from '../../middlewares/auth';
import { createCall, getCall, updateCallStatus } from './call.controller';

const router = express.Router();

router.post('/', auth(), createCall);
router.patch('/:roomId/status', auth(), updateCallStatus);
router.get('/:roomId', auth(), getCall);

export const CallRoutes = router;
