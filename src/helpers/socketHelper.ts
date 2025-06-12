import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));

    socket.on('join', (userId: string) => {
      socket.join(userId);
      logger.info(colors.cyan(`Socket joined room: ${userId}`));
    });

    // socket.on('join', async (driverId: string) => {
    //   socket.join(driverId);
    //   await setDriverOnline(driverId, socket.id);
    // });

    //disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnect'));
    });
  });
};

export const socketHelper = { socket };
