import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { CategoryServices } from './category.service';
import { ICategory } from './category.interface';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';

// Create Category
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryData = req.body;
  const result = await CategoryServices.createCategoryToDB(categoryData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

// Get All Categories
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.getCategoriesFromDB();

  sendResponse<ICategory[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

// Get Single Category by ID
const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryServices.getSingleCategoryFromDB(id);

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

// Update Category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const result = await CategoryServices.updateCategoryToDB(id, updateData);

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Failed to update category');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

// Delete (Soft Delete) Category
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryServices.deleteCategoryToDB(id);

  if (!result) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Category not found or already deleted'
    );
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: {},
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
