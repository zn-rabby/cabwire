import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import httpStatus from 'http-status';

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createUserToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User created successfully',
      data: result,
    });
  }
);

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    let image = getSingleFilePath(req.files, 'image');

    const data = {
      image,
      ...req.body,
    };
    const result = await UserService.updateProfileToDB(user, data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Profile updated successfully',
      data: result,
    });
  }
);

const updateProfileByEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.params.email;
    let image = getSingleFilePath(req.files, 'image');

    const data = {
      email, // ✅ path theke ashche
      image,
      ...req.body,
    };

    const result = await UserService.updateProfileByEmailToDB(data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User profile updated successfully by email',
      data: result,
    });
  }
);

const updateStripeAccountIdByEmail = catchAsync(
  async (req: Request, res: Response) => {
    const email = req.params.email;
    const { stripeAccountId } = req.body;

    const result = await UserService.updateStripeAccountIdByEmail(
      email,
      stripeAccountId
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Stripe account ID updated successfully',
      data: result,
    });
  }
);

const updateUserOnlineStatusByEmail = catchAsync(
  async (req: Request, res: Response) => {
    const email = req.params.email;
    const { isOnline } = req.body;

    const result = await UserService.updateUserOnlineStatusByEmail(
      email,
      isOnline
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User online status updated successfully',
      data: result,
    });
  }
);

const deleteProfile = catchAsync(async (req, res) => {
  const { id }: any = req.user;
  const { password } = req.body;
  const isUserVerified = await UserService.verifyUserPassword(id, password);
  if (!isUserVerified) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Incorrect password. Please try again.',
      data: {},
    });
  }

  const result = await UserService.deleteUser(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile deleted successfully',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.getSingleUserById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Single user fetched successfully!',
  });
});

// user
const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUserQuery(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.result,
    message: 'Users All are requered successful!!',
  });
});
const getTotalUserCount = catchAsync(async (req, res) => {
  const result = await UserService.getTotalUserCount();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All  users count successful!!',
  });
});

const getAllResentUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllResentUserQuery(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.result,
    message: 'Users All are requered successful!!',
  });
});

const userStatusUpdate = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  await UserService.userStatusUpdate(id, updatedData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User Status Update successfully',
    data: {},
  });
});

// driver
const getAllDriver = catchAsync(async (req, res) => {
  const result = await UserService.getAllDriverQuery(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.result,
    message: 'Drivers fetched successfully!',
  });
});
const getAllDriverRequest = catchAsync(async (req, res) => {
  const result = await UserService.getAllDriverRequest(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.result,
    message: 'Drivers fetched successfully!',
  });
});
const getTotalDriverCount = catchAsync(async (req, res) => {
  const result = await UserService.getTotalDriverCount();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All driver count successful!!',
  });
});

const getAllResentDriver = catchAsync(async (req, res) => {
  const result = await UserService.getAllResentDriverQuery(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.result,
    message: 'Driver All are requered successful!!',
  });
});

const driverStatusUpdate = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  await UserService.driverStatusUpdate(id, updatedData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Driver Status Update successfully',
    data: {},
  });
});

const getAllUserCount = catchAsync(async (req, res) => {
  // const result = await UserService.getAllUserCount();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: null,
    message: 'All  users count successful!!',
  });
});

const getAllUserRasio = catchAsync(async (req, res) => {
  const yearQuery = req.query.year;

  // Safely extract year as string
  const year = typeof yearQuery === 'string' ? parseInt(yearQuery) : undefined;

  // if (!year || isNaN(year)) {
  //   return sendResponse(res, {
  //     success: false,
  //     statusCode: httpStatus.BAD_REQUEST,
  //     message: 'Invalid year provided!',
  //     data: { year },
  //   });
  // }

  return sendResponse(res, {
    success: false,
    statusCode: httpStatus.BAD_REQUEST,
    message: 'Invalid year provided!',
    data: year,
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  updateProfileByEmail,
  updateStripeAccountIdByEmail,
  updateUserOnlineStatusByEmail,
  deleteProfile,

  getSingleUser,

  // user
  getAllUsers,
  getTotalUserCount,
  getAllResentUsers,
  userStatusUpdate,
  // driver
  getAllDriver,
  getAllDriverRequest,
  getTotalDriverCount,
  getAllResentDriver,
  driverStatusUpdate,

  getAllUserCount,
  getAllUserRasio,
};
