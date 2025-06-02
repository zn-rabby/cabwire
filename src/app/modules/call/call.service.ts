import { IAudioCall } from './call.interface';
import { AudioCall } from './call.model';

const createCall = async (payload: IAudioCall) => {
  return await AudioCall.create(payload);
};

const updateCallStatus = async (
  roomId: string,
  status: IAudioCall['status']
) => {
  return await AudioCall.findOneAndUpdate(
    { roomId },
    {
      status,
      ...(status === 'accepted' && { startedAt: new Date() }),
      ...(status === 'ended' && { endedAt: new Date() }),
    },
    { new: true }
  );
};

const getCallByRoomId = async (roomId: string) => {
  return await AudioCall.findOne({ roomId });
};

export const AudioCallService = {
  createCall,
  updateCallStatus,
  getCallByRoomId,
};
