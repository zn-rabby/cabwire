import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';

const sendNotificationToDB = async (payload: any): Promise<INotification> => {
  // save to DB
  const response = await Notification.create(payload);

  //@ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`getNotification::${payload?.receiver}`, response);
  }
  return response;
};

// get notifications
// const getNotificationFromDB = async (
//   user: JwtPayload
// ): Promise<INotification> => {
//   const result = await Notification.find({ receiver: user.id }).populate({
//     path: 'userId',
//     select: 'name email',
//   });

//   const unreadCount = await Notification.countDocuments({
//     receiver: user.id,
//     read: false,
//   });

//   const data: any = {
//     result,
//     unreadCount,
//   };

//   return data;
// };
const getNotificationFromDB = async (user: JwtPayload): Promise<any> => {
  const result = await Notification.find({ receiver: user.id })
    .populate({
      path: 'userId',
      select: 'name email',
    })
    .populate({
      path: 'driverId',
      select: 'name phoneNumber email',
    })

    .populate({
      path: 'receiver',
      select: 'name email',
    });

  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    read: false,
  });

  return {
    result,
    unreadCount,
  };
};

// read notifications only for user
const readNotificationToDB = async (
  user: JwtPayload
): Promise<INotification | undefined> => {
  const result: any = await Notification.updateMany(
    { receiver: user.id, read: false },
    { $set: { read: true } }
  );
  return result;
};

// get notifications for admin
const adminNotificationFromDB = async () => {
  const result = await Notification.find({ type: 'ADMIN' });
  return result;
};

// read notifications only for admin
const adminReadNotificationToDB = async (): Promise<INotification | null> => {
  const result: any = await Notification.updateMany(
    { type: 'ADMIN', read: false },
    { $set: { read: true } },
    { new: true }
  );
  return result;
};

export const NotificationService = {
  sendNotificationToDB,
  adminNotificationFromDB,
  getNotificationFromDB,
  readNotificationToDB,
  adminReadNotificationToDB,
};
