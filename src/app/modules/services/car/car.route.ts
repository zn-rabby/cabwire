import express from 'express';
import fileUploadHandler from '../../../middlewares/fileUploadHandler';
import validateRequest from '../../../middlewares/validateRequest';
import { ServiceValidation } from '../../service/service.validation';
import { ServiceController } from './car.controller';
const router = express.Router();

router.post(
  '/create-service',
  // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  fileUploadHandler(),
  validateRequest(ServiceValidation.createServiceZodSchema),
  ServiceController.createService
);

router
  .route('/:id')
  .patch(
    // auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    fileUploadHandler(),
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
