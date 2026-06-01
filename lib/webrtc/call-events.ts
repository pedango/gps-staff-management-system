export type CallType = "audio" | "video";

export type CallPhase = "idle" | "outgoing" | "incoming" | "connecting" | "active";

export const DM_CALL_EVENTS = {
  INVITE: "call-invite",
  ACCEPT: "call-accept",
  DECLINE: "call-decline",
  END: "call-end",
  OFFER: "webrtc-offer",
  ANSWER: "webrtc-answer",
  ICE: "webrtc-ice",
} as const;

export type DmCallEventName = (typeof DM_CALL_EVENTS)[keyof typeof DM_CALL_EVENTS];

export type CallInvitePayload = {
  callId: string;
  sessionId: string;
  type: CallType;
  fromId: string;
  fromName: string;
};

export const ROOM_CALL_EVENTS = {
  PARTICIPANT_JOINED: "participant-joined",
  PARTICIPANT_LEFT: "participant-left",
  SESSION_ENDED: "session-ended",
  OFFER: "webrtc-offer",
  ANSWER: "webrtc-answer",
  ICE: "webrtc-ice",
} as const;

export type RoomCallEventName = (typeof ROOM_CALL_EVENTS)[keyof typeof ROOM_CALL_EVENTS];

export type ParticipantEventPayload = {
  sessionId: string;
  fromId: string;
  participant: { id: string; name: string; email: string; avatar: string | null };
};

export type WebRtcTargetedSdpPayload = {
  sessionId: string;
  fromId: string;
  targetId: string;
  sdp: RTCSessionDescriptionInit;
};

export type WebRtcTargetedIcePayload = {
  sessionId: string;
  fromId: string;
  targetId: string;
  candidate: RTCIceCandidateInit;
};

export type CallIdPayload = {
  callId: string;
  fromId: string;
};

export type WebRtcSdpPayload = {
  callId: string;
  fromId: string;
  sdp: RTCSessionDescriptionInit;
};

export type WebRtcIcePayload = {
  callId: string;
  fromId: string;
  candidate: RTCIceCandidateInit;
};
