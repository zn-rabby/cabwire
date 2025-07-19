import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { ReviewController } from './review.controller';
const router = express.Router();

router.post('/', auth(USER_ROLES.USER), ReviewController.createReview);
router.get('/:id', auth(USER_ROLES.USER), ReviewController.getReview);
router.get(
  '/service/:serviceId',
  auth(USER_ROLES.USER, USER_ROLES.DRIVER, USER_ROLES.ADMIN),
  ReviewController.getReviews
);

export const ReviewRoutes = router;
