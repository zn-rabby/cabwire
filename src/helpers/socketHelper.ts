import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));

    // Driver comes online
    socket.on('driver-online', (driverId: string) => {
      socket.join(`driver::${driverId}`);
      socket.join('online-drivers');
      logger.info(colors.cyan(`Driver ${driverId} came online`));
    });

    // Driver goes offline
    socket.on('driver-offline', (driverId: string) => {
      socket.leave(`driver::${driverId}`);
      socket.leave('online-drivers');
      logger.info(colors.cyan(`Driver ${driverId} went offline`));
    });

    // Ride-specific room joining
    socket.on('join-ride-room', (rideId: string) => {
      socket.join(`ride::${rideId}`);
      logger.info(colors.cyan(`Socket joined ride room ${rideId}`));
    });

    //disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnect'));
    });
  });
};

export const socketHelper = { socket };
