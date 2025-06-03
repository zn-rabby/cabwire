import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IService } from './service.interface';
import { Service } from './service.model';
import unlinkFile from '../../../shared/unlinkFile';

const createServiceToDB = async (payload: IService) => {
  const { serviceName, image } = payload;
  const isExistName = await Service.findOne({ name: serviceName });

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
};

const getServicesFromDB = async (): Promise<IService[]> => {
  const result = await Service.find({});
  if (!result) {
    return [];
  }
  return result;
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
  updateServiceToDB,
  deleteServiceToDB,
  getServiceByCategoryFromDB,
};
