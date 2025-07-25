import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ServiceServices } from './service.service';

const createService = catchAsync(async (req: Request, res: Response) => {
  const { ...serviceData } = req.body;

  const result = await ServiceServices.createServiceToDB(serviceData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Service create successfully',
    data: result,
  });
});

const getServices = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.getServicesFromDB();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const { ide } = req.params;
  const result = await ServiceServices.getSingleServiceFromDB(ide);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Single Service retrieved successfully',
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updateServiceData = req.body;

  const result = await ServiceServices.updateServiceToDB(id, updateServiceData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service updated successfully',
    data: result,
  });
});

const updateServiceStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updateServiceData = req.body;

  const result = await ServiceServices.updateServiceStatusToDB(
    id,
    updateServiceData
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service status updated successfully',
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ServiceServices.deleteServiceToDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service delete successfully',
    data: result,
  });
});

const getServiceByCategory = catchAsync(async (req: Request, res: Response) => {
  // const service = req.params.service;
  const { id } = req.params;
  const result = await ServiceServices.getServiceByCategoryFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service Retrieved by Service Category successfully',
    data: result,
  });
});

export const ServiceController = {
  createService,
  getServices,
  getSingleService,
  updateService,
  updateServiceStatus,
  deleteService,
  getServiceByCategory,
};
