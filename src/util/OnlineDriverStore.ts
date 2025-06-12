// utils/OnlineDriverStore.ts
type DriverOnlineData = {
  driverId: string;
  socketId: string;
};

const onlineDrivers = new Map<string, DriverOnlineData>(); // key: socketId

export const OnlineDriverStore = {
  addDriver(driverId: string, socketId: string) {
    onlineDrivers.set(socketId, { driverId, socketId });
  },
  removeBySocket(socketId: string) {
    onlineDrivers.delete(socketId);
  },
  getDrivers(): DriverOnlineData[] {
    return Array.from(onlineDrivers.values());
  },
  getDriverIds(): string[] {
    return Array.from(onlineDrivers.values()).map(d => d.driverId);
  },
};
