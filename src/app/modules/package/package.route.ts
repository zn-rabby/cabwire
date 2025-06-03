import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { PackageController } from './package.controller';

const router = express.Router();

router.post(
  '/create-package',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PackageController.createPackage
);

router.patch(
  '/accept-package/:packageId',
  auth(USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PackageController.acceptPackage
);

export const PackageRoutes = router;
