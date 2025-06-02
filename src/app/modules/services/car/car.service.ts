import { StatusCodes } from 'http-status-codes';
import { CarService } from './car.model';
import ApiError from '../../../../errors/ApiError';
import { ICarService } from './car.interface';
import unlinkFile from '../../../../shared/unlinkFile';

const createServiceToDB = async (payload: ICarService) => {
  const { name, image } = payload;
  const isExistName = await CarService.findOne({ name: name });

  if (isExistName) {
    unlinkFile(image);
    throw new ApiError(
      StatusCodes.NOT_ACCEPTABLE,
      'This Service Name Already Exist'
    );
  }

  const createService: any = await CarService.create(payload);
  if (!createService) {
    unlinkFile(image);
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Service');
  }

  return createService;
};

const getServicesFromDB = async (): Promise<ICarService[]> => {
  const result = await CarService.find({});
  if (!result) {
    return [];
  }
  return result;
};

const updateServiceToDB = async (id: string, payload: ICarService) => {
  const isExistService: any = await CarService.findById(id);

  if (!isExistService) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Service doesn't exist");
  }

  if (payload.image) {
    unlinkFile(isExistService?.image);
  }

  const updateService = await CarService.findOneAndUpdate(
    { _id: id },
    payload,
    {
      new: true,
    }
  );

  return updateService;
};

const deleteServiceToDB = async (id: string): Promise<ICarService | null> => {
  const deleteService = await CarService.findByIdAndDelete(id);
  if (!deleteService) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Service doesn't exist");
  }
  return deleteService;
};

const getServiceByCategoryFromDB = async (
  service: string
): Promise<ICarService[]> => {
  const services = await CarService.find({ category: service })
    .sort({ createdAt: -1 })
    .select('image title rating adult location')
    .lean();
  if (!services) {
    return [];
  }
  return services;
};

export const Service  = {
  createServiceToDB,
  getServicesFromDB,
  updateServiceToDB,
  deleteServiceToDB,
  getServiceByCategoryFromDB,
};
