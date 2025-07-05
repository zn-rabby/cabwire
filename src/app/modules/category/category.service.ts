import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ICategory } from './category.interface';
import { Category } from './category.model';
import unlinkFile from '../../../shared/unlinkFile';

// Create Category
const createCategoryToDB = async (payload: ICategory): Promise<ICategory> => {
  const { categoryName, image } = payload;

  const isExist = await Category.findOne({ name: categoryName });

  if (isExist) {
    if (image) unlinkFile(image);
    throw new ApiError(
      StatusCodes.NOT_ACCEPTABLE,
      'This Category Name Already Exists'
    );
  }

  const newCategory = await Category.create(payload);

  if (!newCategory) {
    if (image) unlinkFile(image);
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

const updateCategoryToDB = async (
  id: string,
  payload: Partial<ICategory>
): Promise<ICategory | null> => {
  const isExistCategory = await Category.findById(id);

  if (!isExistCategory || isExistCategory.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  if (payload.image && isExistCategory.image) {
    unlinkFile(isExistCategory.image);
  }

  const updatedCategory = await Category.findOneAndUpdate(
    { _id: id },
    payload,
    { new: true }
  );

  return updatedCategory;
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
