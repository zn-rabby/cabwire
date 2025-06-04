// import { Server } from 'socket.io';
// import { logger } from '../shared/logger';
// import colors from 'colors';

// // socketHelper.ts
// const socket = (io: Server) => {
//   io.on('connection', socket => {
//     logger.info(colors.blue('একজন ইউজার কানেক্ট হয়েছে'));

//     // ✅ ড্রাইভার হিসেবে join করার জন্য ইভেন্ট
//     socket.on('join-as-driver', () => {
//       socket.join('drivers');
//       logger.info(colors.cyan('একজন ড্রাইভার "drivers" রুমে যুক্ত হয়েছে'));
//     });

//     socket.on('disconnect', () => {
//       logger.info(colors.red('একজন ইউজার ডিসকানেক্ট হয়েছে'));
//     });
//   });
// };
