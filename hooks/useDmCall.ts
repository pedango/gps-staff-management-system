"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acquireDmChannel, releaseDmChannel } from "@/lib/pusher-channel";
import { getPusherClient } from "@/lib/pusher-client";
import { emitCallSignal } from "@/lib/webrtc/emit-call-signal";
import {
  DM_CALL_EVENTS,
  type CallIdPayload,
  type CallInvitePayload,
  type CallPhase,
  type CallType,
  type WebRtcIcePayload,
  type WebRtcSdpPayload,
} from "@/lib/webrtc/call-events";
import { getIceServers } from "@/lib/webrtc/ice-servers";

function newCallId(): string {
  return crypto.randomUUID();
}

export function useDmCall({
  conversationId,
  selfId,
  selfName,
}: {
  conversationId: string;
  selfId: string;
  selfName: string;
  peerId: string;
  peerName: string;
}) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [callType, setCallType] = useState<CallType | null>(null);
  const [incomingFromName, setIncomingFromName] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [pusherReady, setPusherReady] = useState(false);

  const callIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const phaseRef = useRef<CallPhase>("idle");
  const localStreamRef = useRef<MediaStream | null>(null);

  phaseRef.current = phase;
  localStreamRef.current = localStream;

  const cleanupMedia = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    iceQueueRef.current = [];
    const stream = localStreamRef.current;
    stream?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setIsMuted(false);
    setIsCameraOff(false);
    callIdRef.current = null;
    isCallerRef.current = false;
  }, []);

  const endCallLocal = useCallback(() => {
    cleanupMedia();
    setPhase("idle");
    setCallType(null);
    setIncomingFromName(null);
  }, [cleanupMedia]);

  const flushIceQueue = useCallback(async (pc: RTCPeerConnection) => {
    const queued = [...iceQueueRef.current];
    iceQueueRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // ignore stale candidates
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (stream: MediaStream, callId: string) => {
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (remote) {
          setRemoteStream(remote);
        } else if (ev.track) {
          setRemoteStream(new MediaStream([ev.track]));
        }
        setPhase("active");
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !callIdRef.current) {
          return;
        }
        void emitCallSignal(conversationId, DM_CALL_EVENTS.ICE, {
          callId,
          candidate: ev.candidate.toJSON(),
        }).catch(() => undefined);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          if (phaseRef.current === "active" || phaseRef.current === "connecting") {
            endCallLocal();
          }
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [conversationId, endCallLocal],
  );

  const getMedia = useCallback(async (type: CallType) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Your browser does not support calls");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCallerNegotiation = useCallback(
    async (callId: string, stream: MediaStream) => {
      setPhase("connecting");
      const pc = createPeerConnection(stream, callId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await emitCallSignal(conversationId, DM_CALL_EVENTS.OFFER, {
          callId,
          sdp: offer,
        });
      } catch {
        endCallLocal();
      }
    },
    [conversationId, createPeerConnection, endCallLocal],
  );

  const handleOffer = useCallback(
    async (payload: WebRtcSdpPayload) => {
      if (payload.fromId === selfId || payload.callId !== callIdRef.current) {
        return;
      }
      const stream = localStreamRef.current;
      if (!stream) {
        return;
      }
      setPhase("connecting");
      const pc = createPeerConnection(stream, payload.callId);
      try {
        await pc.setRemoteDescription(payload.sdp);
        await flushIceQueue(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await emitCallSignal(conversationId, DM_CALL_EVENTS.ANSWER, {
          callId: payload.callId,
          sdp: answer,
        });
      } catch {
        endCallLocal();
      }
    },
    [conversationId, createPeerConnection, endCallLocal, flushIceQueue, selfId],
  );

  const handleAnswer = useCallback(
    async (payload: WebRtcSdpPayload) => {
      if (payload.fromId === selfId || payload.callId !== callIdRef.current) {
        return;
      }
      const pc = pcRef.current;
      if (!pc) {
        return;
      }
      setPhase("connecting");
      try {
        await pc.setRemoteDescription(payload.sdp);
        await flushIceQueue(pc);
      } catch {
        endCallLocal();
      }
    },
    [endCallLocal, flushIceQueue, selfId],
  );

  const handleIce = useCallback(
    async (payload: WebRtcIcePayload) => {
      if (payload.fromId === selfId || payload.callId !== callIdRef.current) {
        return;
      }
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        iceQueueRef.current.push(payload.candidate);
        return;
      }
      try {
        await pc.addIceCandidate(payload.candidate);
      } catch {
        // ignore
      }
    },
    [selfId],
  );

  useEffect(() => {
    const pusher = getPusherClient();
    setPusherReady(Boolean(pusher));
    const channel = acquireDmChannel(conversationId);
    if (!channel) {
      return;
    }

    const onInvite = (payload: CallInvitePayload) => {
      if (payload.fromId === selfId) {
        return;
      }
      if (phaseRef.current !== "idle") {
        return;
      }
      callIdRef.current = payload.callId;
      isCallerRef.current = false;
      setCallType(payload.type);
      setIncomingFromName(payload.fromName);
      setPhase("incoming");
    };

    const onAccept = (payload: CallIdPayload) => {
      if (payload.fromId === selfId) {
        return;
      }
      if (payload.callId !== callIdRef.current || !isCallerRef.current) {
        return;
      }
      const stream = localStreamRef.current;
      if (!stream) {
        return;
      }
      void startCallerNegotiation(payload.callId, stream);
    };

    const onDecline = (payload: CallIdPayload) => {
      if (payload.fromId === selfId) {
        return;
      }
      if (payload.callId !== callIdRef.current) {
        return;
      }
      endCallLocal();
    };

    const onEnd = (payload: CallIdPayload) => {
      if (payload.fromId === selfId) {
        return;
      }
      if (payload.callId !== callIdRef.current) {
        return;
      }
      endCallLocal();
    };

    channel.bind(DM_CALL_EVENTS.INVITE, onInvite);
    channel.bind(DM_CALL_EVENTS.ACCEPT, onAccept);
    channel.bind(DM_CALL_EVENTS.DECLINE, onDecline);
    channel.bind(DM_CALL_EVENTS.END, onEnd);
    channel.bind(DM_CALL_EVENTS.OFFER, handleOffer);
    channel.bind(DM_CALL_EVENTS.ANSWER, handleAnswer);
    channel.bind(DM_CALL_EVENTS.ICE, handleIce);

    return () => {
      channel.unbind(DM_CALL_EVENTS.INVITE, onInvite);
      channel.unbind(DM_CALL_EVENTS.ACCEPT, onAccept);
      channel.unbind(DM_CALL_EVENTS.DECLINE, onDecline);
      channel.unbind(DM_CALL_EVENTS.END, onEnd);
      channel.unbind(DM_CALL_EVENTS.OFFER, handleOffer);
      channel.unbind(DM_CALL_EVENTS.ANSWER, handleAnswer);
      channel.unbind(DM_CALL_EVENTS.ICE, handleIce);
      releaseDmChannel(conversationId);
      cleanupMedia();
    };
  }, [
    conversationId,
    selfId,
    handleOffer,
    handleAnswer,
    handleIce,
    startCallerNegotiation,
    endCallLocal,
    cleanupMedia,
  ]);

  const startCall = useCallback(
    async (type: CallType) => {
      if (phaseRef.current !== "idle") {
        return;
      }
      const callId = newCallId();
      callIdRef.current = callId;
      isCallerRef.current = true;
      setCallType(type);
      setPhase("outgoing");
      try {
        await getMedia(type);
        await emitCallSignal(conversationId, DM_CALL_EVENTS.INVITE, {
          callId,
          type,
          fromName: selfName,
        });
      } catch {
        endCallLocal();
        throw new Error("Could not start call. Check microphone/camera permissions.");
      }
    },
    [conversationId, endCallLocal, getMedia, selfName],
  );

  const acceptCall = useCallback(async () => {
    const callId = callIdRef.current;
    const type = callType;
    if (!callId || !type || phaseRef.current !== "incoming") {
      return;
    }
    setPhase("connecting");
    try {
      await getMedia(type);
      await emitCallSignal(conversationId, DM_CALL_EVENTS.ACCEPT, { callId });
    } catch {
      endCallLocal();
      throw new Error("Could not join call. Check microphone/camera permissions.");
    }
  }, [callType, conversationId, endCallLocal, getMedia]);

  const declineCall = useCallback(async () => {
    const callId = callIdRef.current;
    if (!callId) {
      endCallLocal();
      return;
    }
    try {
      await emitCallSignal(conversationId, DM_CALL_EVENTS.DECLINE, { callId });
    } catch {
      // still end locally
    }
    endCallLocal();
  }, [conversationId, endCallLocal]);

  const endCall = useCallback(async () => {
    const callId = callIdRef.current;
    if (callId) {
      try {
        await emitCallSignal(conversationId, DM_CALL_EVENTS.END, { callId });
      } catch {
        // still end locally
      }
    }
    endCallLocal();
  }, [conversationId, endCallLocal]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }
    const audio = stream.getAudioTracks()[0];
    if (!audio) {
      return;
    }
    audio.enabled = !audio.enabled;
    setIsMuted(!audio.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }
    const video = stream.getVideoTracks()[0];
    if (!video) {
      return;
    }
    video.enabled = !video.enabled;
    setIsCameraOff(!video.enabled);
  }, []);

  const inCallUi = phase === "outgoing" || phase === "connecting" || phase === "active";

  return {
    phase,
    callType,
    incomingFromName,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    pusherReady,
    inCallUi,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
