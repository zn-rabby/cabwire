import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceController } from './service.controller';
import { ServiceValidation } from './service.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import parseFileData from '../../middlewares/parseFileData';
const router = express.Router();

router.post(
  '/create-service',
  // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  fileUploadHandler(),
  parseFileData('image'),
  validateRequest(ServiceValidation.createServiceZodSchema),
  ServiceController.createService
);
router.get(
  '/:ide',
  // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  ServiceController.getSingleService
);
router
  .route('/:id')
  .patch(
    // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    fileUploadHandler(),
    parseFileData('image'),
    ServiceController.updateService
  )
  .delete(
    // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    ServiceController.deleteService
  );

router.get(
  '/',
  // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  ServiceController.getServices
);

router.get(
  '/:service',
  // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  ServiceController.getServiceByCategory
);

export const ServiceRoutes = router;
