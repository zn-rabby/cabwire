import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IService } from './service.interface';
import { Service } from './service.model';
import unlinkFile from '../../../shared/unlinkFile';

// const createServiceToDB = async (payload: IService) => {
//   const { serviceName, image } = payload;
//   const isExistName = await Service.findOne({ name: serviceName });

//   if (isExistName) {
//     unlinkFile(image);
//     throw new ApiError(
//       StatusCodes.NOT_ACCEPTABLE,
//       'This Service Name Already Exist'
//     );
//   }

//   const createService: any = await Service.create(payload);
//   if (!createService) {
//     unlinkFile(image);
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Service');
//   }

//   return createService;
// };

const createServiceToDB = async (payload: IService) => {
  const { serviceName, image } = payload;

  try {
    const isExistName = await Service.findOne({ serviceName });
    if (isExistName) {
      unlinkFile(image);
      throw new ApiError(
        StatusCodes.NOT_ACCEPTABLE,
        'This Service Name Already Exist'
      );
    }

    const createService: any = await Service.create(payload);
    if (!createService) {
      unlinkFile(image);
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Service');
    }

    return createService;
  } catch (error: any) {
    // Duplicate key error handling (E11000)
    if (error.code === 11000 && error.message.includes('serviceName')) {
      unlinkFile(image);
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Service name already exists in database'
      );
    }

    throw error;
  }
};

const getServicesFromDB = async (): Promise<IService[]> => {
  const result = await Service.find({});
  if (!result) {
    return [];
  }
  return result;
};
const getSingleServiceFromDB = async (
  identifier: string
): Promise<IService | null> => {
  let service: IService | null = null;

  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    // If it's a valid MongoDB ObjectId
    service = await Service.findById(identifier);
  } else {
    // Otherwise, search by name
    service = await Service.findOne({ name: identifier });
  }

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found');
  }

  return service;
};

const updateServiceToDB = async (id: string, payload: IService) => {
  const isExistService: any = await Service.findById(id);

  if (!isExistService) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Service doesn't exist");
  }

  if (payload.image) {
    unlinkFile(isExistService?.image);
  }

  const updateService = await Service.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateService;
};

const updateServiceStatusToDB = async (id: string, payload: IService) => {
  const isExistService: any = await Service.findById(id);

  if (!isExistService) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Service doesn't exist");
  }

  if (payload.image) {
    unlinkFile(isExistService?.image);
  }

  const updateService = await Service.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateService;
};

const deleteServiceToDB = async (id: string): Promise<IService | null> => {
  const deleteService = await Service.findByIdAndDelete(id);
  if (!deleteService) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Service doesn't exist");
  }
  return deleteService;
};

const getServiceByCategoryFromDB = async (
  service: string
): Promise<IService[]> => {
  const services = await Service.find({ category: service })
    .sort({ createdAt: -1 })
    .select('image title rating adult location')
    .lean();
  if (!services) {
    return [];
  }
  return services;
};

export const ServiceServices = {
  createServiceToDB,
  getServicesFromDB,
  getSingleServiceFromDB,
  updateServiceToDB,
  updateServiceStatusToDB,
  deleteServiceToDB,
  getServiceByCategoryFromDB,
};
