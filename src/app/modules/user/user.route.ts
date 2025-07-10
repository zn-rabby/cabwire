import { UserController } from './user.controller';

import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';
import parseFileData from '../../middlewares/parseFileData';
import { getSingleFilePath } from '../../../shared/getFilePath';
const router = express.Router();

// common routes
router
  .route('/')
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser
  );

router
  .route('/profile')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.USER,
      USER_ROLES.DRIVER
    ),
    UserController.getUserProfile
  )
  .patch(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.USER,
      USER_ROLES.DRIVER
    ),
    fileUploadHandler(),
    (req: Request, res: Response, next: NextFunction) => {
      if (req.body.data) {
        req.body = UserValidation.updateUserZodSchema.parse(
          JSON.parse(req.body.data)
        );
      }
      return UserController.updateProfile(req, res, next);
    }
  );

router.patch(
  '/update-profile-by-email/:email',
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    const image = getSingleFilePath(req.files, 'image');
    const data = JSON.parse(req.body.data);
    req.body = { image, ...data };
    next();
  },
  validateRequest(UserValidation.updateUserZodSchema),
  UserController.updateProfileByEmail
);



router.patch(
  '/update-stripe-account/:email',
  UserController.updateStripeAccountIdByEmail
);

router.patch(
  '/update-online-status/:email',
  UserController.updateUserOnlineStatusByEmail
);

router.delete(
  '/delete-my-account',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.DRIVER,
    USER_ROLES.USER
  ),
  UserController.deleteProfile
);

router.get(
  '/details/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getSingleUser
);

//  only for users
router.get(
  '/all-users',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllUsers
);
router.get(
  '/total-users-count',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getTotalUserCount
);
router.get(
  '/total-resent-users',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllResentUsers
);
router.patch(
  '/block-user/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.userStatusUpdate
);

// only for driver
router.get(
  '/all-drivers',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllDriver
);
router.get(
  '/all-drivers-request',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllDriverRequest
);
router.get(
  '/all-drivers-request-count',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllDriverRequestCount
);
router.get(
  '/all-driver-count',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getTotalDriverCount
);
router.get(
  '/total-resent-driver',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllResentDriver
);

router.patch(
  '/driver/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.driverStatusUpdate
);
router.patch(
  '/approve',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.driverStatusApproveAll
);
router.patch(
  '/reject',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.driverStatusApproveAll
);

router.get(
  '/all-driver',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllUsers
);
router.get(
  '/all-users-rasio',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getAllUserRasio
);

export const UserRoutes = router;
