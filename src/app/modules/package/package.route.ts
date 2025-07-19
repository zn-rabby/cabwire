import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { PackageController } from './package.controller';

const router = express.Router();

router.post(
  '/create-package',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  PackageController.createPackage
);

router.patch(
  '/accept-package/:packageId',
  auth(USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PackageController.acceptPackage
);

// ! start otp
router.patch(
  '/request-otp-continue-package/:id',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.DRIVER,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN
  ),
  PackageController.requestStaratOTPPackage
);
router.post(
  '/verify-package-otp-match/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.DRIVER, USER_ROLES.USER),
  PackageController.requestCompleteOTPPackage
);

router.patch(
  '/continue-package/:packageId',
  auth(USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PackageController.continuePackage
);

router.patch(
  '/deliver-package/:packageId',
  auth(USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PackageController.markAsDelivered
);

router.patch(
  '/request-close-package/:id',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.DRIVER,
    USER_ROLES.USER,
    USER_ROLES.SUPER_ADMIN
  ),
  PackageController.requestClosePackage
);

router.post(
  '/verify-package-otp/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.DRIVER, USER_ROLES.DRIVER, USER_ROLES.USER),
  PackageController.completePackageeWithOtp
);

router.post(
  '/package-payment',
  auth(
    USER_ROLES.USER,
    USER_ROLES.DRIVER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ),
  PackageController.createPackagePayment
);

export const PackageRoutes = router;
