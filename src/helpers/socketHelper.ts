import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));
    io.on('connection', socket => {
      // When driver comes online
      socket.on('driver-online', (driverId: string) => {
        socket.join(`driver::${driverId}`);
        socket.join('online-drivers');
        logger.info(colors.cyan(`Driver ${driverId} came online`));
      });

      // When driver goes offline
      socket.on('driver-offline', (driverId: string) => {
        socket.leave(`driver::${driverId}`);
        socket.leave('online-drivers');
        logger.info(colors.cyan(`Driver ${driverId} went offline`));
      });

      // When user or driver joins a ride room
      socket.on('join-ride-room', (rideId: string) => {
        socket.join(`ride::${rideId}`);
        logger.info(colors.cyan(`Socket joined ride room ${rideId}`));
      });

      // Optional: Join user room for ride updates
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user::${userId}`);
        logger.info(colors.cyan(`Socket joined user room ${userId}`));
      });
    });

    //disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnect'));
    });
  });
};

export const socketHelper = { socket };
