import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { DeleteAccountPayload, IUser } from './user.interface';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  //set role
  // payload.role = USER_ROLES.USER;
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  //send email
  const otp = generateOTP();
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } }
  );

  return createUser;
};

const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const updateProfileByEmailToDB = async (
  payload: Partial<IUser> & { email: string }
): Promise<Partial<IUser | null>> => {
  const { email, image, ...rest } = payload;

  const isExistUser = await User.findOne({ email });
  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "User with this email doesn't exist!"
    );
  }

  if (image && isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  const updatedDoc = await User.findOneAndUpdate(
    { email },
    {
      ...rest,
      ...(image && { image }),
    },
    { new: true }
  );

  return updatedDoc;
};

const verifyUserPassword = async (userId: string, password: string) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.');
  }
  const isPasswordValid = await User.isMatchPassword(password, user.password);
  return isPasswordValid;
};
const deleteUser = async (id: string) => {
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  await User.findByIdAndUpdate(id, {
    $set: { isDeleted: true },
  });

  return true;
};

// only for user
const getAllUserQuery = async (query: Record<string, unknown>) => {
  const filters: Record<string, unknown> = {
    role: { $in: [USER_ROLES.USER] }, // ✅ Only USER, PASSENGER, DRIVER
  };

  const userQuery = new QueryBuilder(User.find(filters), query)
    .search(['name', 'email']) // Optional searchable fields
    .filter()
    // .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return { meta, result };
};

const getTotalUserCount = async () => {
  const userCount = await User.countDocuments({ role: USER_ROLES.USER });
  return userCount;
};
const getAllResentUserQuery = async (query: Record<string, unknown>) => {
  const filters: Record<string, unknown> = {
    role: { $in: [USER_ROLES.USER] },
  };

  const userQuery = new QueryBuilder(User.find(filters), query)
    .search(['name', 'email']) // Optional searchable fields
    .filter()
    .sort('-createdAt') // ✅ Sort by recent join (newest first)
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return { meta, result };
};

const userStatusUpdate = async (id: string, payload: Partial<IUser>) => {
  // check user is exits
  const user = await User.findOne({ _id: id });
  console.log('user', user);

  if (!user) {
    throw new ApiError(404, 'User not found!');
  }

  if (user?.role !== 'USER') {
    throw new ApiError(403, 'Only user status can be blocked!');
  }

  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

// only for user
const getAllDriverQuery = async (query: Record<string, unknown>) => {
  const filters: Record<string, unknown> = {
    role: { $in: [USER_ROLES.DRIVER] },
  };

  const userQuery = new QueryBuilder(User.find(filters), query)
    .search(['name', 'email']) // Optional searchable fields
    .filter()
    // .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return { meta, result };
};

const getTotalDriverCount = async () => {
  const userCount = await User.countDocuments({ role: USER_ROLES.DRIVER });
  return userCount;
};

const getAllResentDriverQuery = async (query: Record<string, unknown>) => {
  const filters: Record<string, unknown> = {
    role: { $in: [USER_ROLES.DRIVER] },
  };

  const userQuery = new QueryBuilder(User.find(filters), query)
    .search(['name', 'email']) // Optional searchable fields
    .filter()
    .sort('-createdAt') // ✅ Sort by recent join (newest first)
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return { meta, result };
};

const driverStatusUpdate = async (id: string, payload: Partial<IUser>) => {
  // check user is exits
  const user = await User.findOne({ _id: id });
  console.log('user', user);

  if (!user) {
    throw new ApiError(404, 'User not found!');
  }

  if (user?.role !== 'DRIVER') {
    throw new ApiError(403, 'Only driver status can be updated!');
  }
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const getAllUserRatio = async (year: number) => {
  const startOfYear = new Date(year, 0, 1); // January 1st of the given year
  const endOfYear = new Date(year + 1, 0, 1); // January 1st of the next year

  // Create an array with all 12 months to ensure each month appears in the result
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    userCount: 0, // Default count of 0
  }));

  const userRatios = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfYear,
          $lt: endOfYear,
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' }, // Group by month (1 = January, 12 = December)
        userCount: { $sum: 1 }, // Count users for each month
      },
    },
    {
      $project: {
        month: '$_id', // Rename the _id field to month
        userCount: 1,
        _id: 0,
      },
    },
    {
      $sort: { month: 1 }, // Sort by month in ascending order (1 = January, 12 = December)
    },
  ]);

  // Merge the months array with the actual data to ensure all months are included
  const fullUserRatios = months.map(monthData => {
    const found = userRatios.find(data => data.month === monthData.month);
    return found ? found : monthData; // Use found data or default to 0
  });

  return fullUserRatios;
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  updateProfileByEmailToDB,
  deleteUser,
  verifyUserPassword,

  // user
  getAllUserQuery,
  getTotalUserCount,
  getAllResentUserQuery,
  userStatusUpdate,

  // driver
  getAllDriverQuery,
  getTotalDriverCount,
  getAllResentDriverQuery,
  driverStatusUpdate,

  getAllUserRatio,
};
