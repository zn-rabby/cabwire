import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser } from './user.interface';
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
  email: string,
  payload: Partial<IUser>
): Promise<IUser | null> => {
  const isExistUser = await User.findOne({ email });

  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User with this email doesn't exist!"
    );
  }

  // 🔗 Remove old image if new image is coming
  if (payload.image && isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  const updatedUser = await User.findOneAndUpdate({ email }, payload, {
    new: true,
  });

  return updatedUser;
};

const updateProfileDriverByEmailToDB = async (
  email: string,
  payload: Partial<IUser>
): Promise<IUser | null> => {
  const isExistUser = await User.findOne({ email });
  console.log('payload', payload);
  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User with this email doesn't exist!"
    );
  }

  // 🔗 Remove old image if new image is coming
  if (payload.image && isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  const updatedUser = await User.findOneAndUpdate(
    { email },
    {
      ...(payload.image && {
        'driverLicense.uploadDriversLicense': payload.image,
      }),
      ...(payload.driverLicense?.licenseNumber && {
        'driverLicense.licenseNumber': payload.driverLicense.licenseNumber,
      }),
      ...(payload.driverLicense?.licenseExpiryDate && {
        'driverLicense.licenseExpiryDate':
          payload.driverLicense.licenseExpiryDate,
      }),
    },
    {
      new: true,
    }
  );

  return updatedUser;
};
const updateProfileVehiclesByEmailToDB = async (
  email: string,
  payload: Partial<IUser>
): Promise<IUser | null> => {
  const isExistUser = await User.findOne({ email });
  console.log('payload', payload);

  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User with this email doesn't exist!"
    );
  }

  // 🔗 Remove old image if new image is coming
  if (
    payload.driverVehicles?.vehiclesPicture &&
    isExistUser.driverVehicles?.vehiclesPicture
  ) {
    unlinkFile(isExistUser.driverVehicles.vehiclesPicture);
  }

  const updatedUser = await User.findOneAndUpdate(
    { email },
    {
      ...(payload.driverVehicles?.vehiclesMake && {
        'driverVehicles.vehiclesMake': payload.driverVehicles.vehiclesMake,
      }),
      ...(payload.driverVehicles?.vehiclesModel && {
        'driverVehicles.vehiclesModel': payload.driverVehicles.vehiclesModel,
      }),
      ...(payload.driverVehicles?.vehiclesYear && {
        'driverVehicles.vehiclesYear': payload.driverVehicles.vehiclesYear,
      }),
      ...(payload.driverVehicles?.vehiclesRegistrationNumber && {
        'driverVehicles.vehiclesRegistrationNumber':
          payload.driverVehicles.vehiclesRegistrationNumber,
      }),
      ...(payload.driverVehicles?.vehiclesInsuranceNumber && {
        'driverVehicles.vehiclesInsuranceNumber':
          payload.driverVehicles.vehiclesInsuranceNumber,
      }),
      ...(payload.image && {
        'driverVehicles.vehiclesPicture': payload.image,
      }),
      ...(payload.driverVehicles?.vehiclesCategory && {
        'driverVehicles.vehiclesCategory':
          payload.driverVehicles.vehiclesCategory,
      }),
    },
    {
      new: true,
    }
  );

  return updatedUser;
};

const updateStripeAccountIdByEmail = async (
  email: string,
  stripeAccountId?: string
): Promise<Partial<IUser | null>> => {
  const isExistUser = await User.findOne({ email });

  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "User with this email doesn't exist!"
    );
  }

  const updatedDoc = await User.findOneAndUpdate(
    { email },
    { stripeAccountId },
    { new: true }
  );

  return updatedDoc;
};

const updateUserOnlineStatusByEmail = async (
  email: string,
  isOnline: boolean
): Promise<Partial<IUser | null>> => {
  const isExistUser = await User.findOne({ email });

  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "User with this email doesn't exist!"
    );
  }

  const updatedDoc = await User.findOneAndUpdate(
    { email },
    { isOnline },
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

  // 🚨 Permanently delete user from DB
  await User.findByIdAndDelete(id);

  return true;
};
const getSingleUserById = async (id: string) => {
  const user = await User.findById(id).select('-password -authentication'); // sensitive data exclude
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
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

  if (user?.role !== 'USER' && user?.role !== 'DRIVER') {
    throw new ApiError(403, 'Only USER or DRIVER status can be blocked!');
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
    action: 'approve', // Only approved drivers
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
const getAllDriverRequest = async (query: Record<string, unknown>) => {
  const filters: Record<string, unknown> = {
    role: { $in: [USER_ROLES.DRIVER] },
    action: 'request', // Only approved drivers
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
const getAllDriverRequestCoount = async (query: Record<string, unknown>) => {
  const filters: Record<string, unknown> = {
    role: { $in: [USER_ROLES.DRIVER] },
    action: 'request', // Only approved drivers
  };

  const userQuery = new QueryBuilder(User.find(filters), query)
    .search(['name', 'email']) // Optional searchable fields
    .filter()
    .fields();

  const count = await userQuery.modelQuery.countDocuments(); // Only count the matching documents
  return { count }; // Return the count
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

  if (user?.role !== 'USER' && user?.role !== 'DRIVER') {
    throw new ApiError(403, 'Only USER or DRIVER status can be blocked!');
  }

  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const driverStatusApproveAll = async (): Promise<any> => {
  // Approve all DRIVERs whose action is 'request'
  const result = await User.updateMany(
    {
      role: 'DRIVER',
      action: 'request',
    },
    {
      $set: { action: 'approve' },
    }
  );

  return result;
};
const driverStatusRejectAll = async (): Promise<any> => {
  // Approve all DRIVERs whose action is 'request'
  const result = await User.updateMany(
    {
      role: 'DRIVER',
      action: 'request',
    },
    {
      $set: { action: 'reject' },
    }
  );

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
  updateProfileDriverByEmailToDB,
  updateProfileVehiclesByEmailToDB,
  updateStripeAccountIdByEmail,
  updateUserOnlineStatusByEmail,
  deleteUser,
  verifyUserPassword,
  getSingleUserById,

  // user
  getAllUserQuery,
  getTotalUserCount,
  getAllResentUserQuery,
  userStatusUpdate,

  // driver
  getAllDriverQuery,
  getAllDriverRequest,
  getAllDriverRequestCoount,
  getTotalDriverCount,
  getAllResentDriverQuery,
  driverStatusUpdate,
  driverStatusApproveAll,
  driverStatusRejectAll,

  getAllUserRatio,
};
