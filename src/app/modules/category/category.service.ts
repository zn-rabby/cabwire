import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ICategory } from './category.interface';
import { Category } from './category.model';

// Create Category
const createCategoryToDB = async (payload: ICategory): Promise<ICategory> => {
  const isExist = await Category.findOne({ name: payload.name });

  if (isExist) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This Category Name Already Exists'
    );
  }

  const newCategory = await Category.create(payload);
  if (!newCategory) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Category');
  }

  return newCategory;
};

// Get All Categories
const getCategoriesFromDB = async (): Promise<ICategory[]> => {
  const categories = await Category.find({ isDeleted: false }).sort({
    createdAt: -1,
  });
  return categories;
};

// Get Single Category by ID
const getSingleCategoryFromDB = async (
  id: string
): Promise<ICategory | null> => {
  const category = await Category.findById(id);
  if (!category || category.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  return category;
};

// Update Category
const updateCategoryToDB = async (
  id: string,
  payload: Partial<ICategory>
): Promise<ICategory | null> => {
  const isExist = await Category.findById(id);
  if (!isExist || isExist.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  const updated = await Category.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return updated;
};

// Soft Delete Category
const deleteCategoryToDB = async (id: string): Promise<ICategory | null> => {
  const isExist = await Category.findById(id);
  if (!isExist || isExist.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  const deleted = await Category.findByIdAndUpdate(
    id,
    { isDeleted: true, isActive: false },
    { new: true }
  );

  return deleted;
};

export const CategoryServices = {
  createCategoryToDB,
  getCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryToDB,
  deleteCategoryToDB,
};
