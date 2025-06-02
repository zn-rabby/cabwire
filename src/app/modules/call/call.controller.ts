import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AudioCallService } from './call.service';

export const createCall = catchAsync(async (req: Request, res: Response) => {
  const result = await AudioCallService.createCall(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Call initiated',
    data: result,
  });
});

export const updateCallStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { status } = req.body;

    const result = await AudioCallService.updateCallStatus(roomId, status);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Call status updated',
      data: result,
    });
  }
);

export const getCall = catchAsync(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const result = await AudioCallService.getCallByRoomId(roomId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Call info retrieved',
    data: result,
  });
});
