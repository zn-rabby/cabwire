import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { CategoryController } from './category.controller';
import validateRequest from '../../middlewares/validateRequest';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router
  .route('/')
  .post(
    // auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileUploadHandler(),
    CategoryController.createCategory
  )
  .get(
    auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    CategoryController.getAllCategories
  );

router
  .route('/:id')
  .get(
    // auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    CategoryController.getSingleCategory
  )
  .patch(
    // auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileUploadHandler(),
    CategoryController.updateCategory
  )
  .delete(
    // auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    CategoryController.deleteCategory
  );

export const CategoryRoutes = router;
