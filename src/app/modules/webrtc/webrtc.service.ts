// import {
//   WebRtcClient,
//   WebRtcController,
//   Participant,
//   Subscriptions,
//   DeviceApiVersionEnum,
//   PublishPermissionEnum,
// } from '@bandwidth/webrtc';
// import { WebrtcParticipant } from './webrtc.interface';
// import config from '../../../config';

// const { username, password, accountId, voiceCallbackUrl } = config;

// const webRTCClient = new WebRtcClient({
//   basicAuthUserName: username,
//   basicAuthPassword: password,
// });
// const webRTCController = new WebRtcController(webRTCClient);

// export const createParticipant = async (
//   tag: string
// ): Promise<WebrtcParticipant> => {
//   const participantBody: Participant = {
//     tag,
//     publishPermissions: [PublishPermissionEnum.AUDIO],
//     deviceApiVersion: DeviceApiVersionEnum.V3,
//     callbackUrl: `${voiceCallbackUrl}/killConnection`,
//   };

//   const createParticipantResponse = await webRTCController.createParticipant(
//     accountId,
//     participantBody
//   );
//   const participant = createParticipantResponse.result.participant;
//   return { id: participant.id, token: createParticipantResponse.result.token };
// };
