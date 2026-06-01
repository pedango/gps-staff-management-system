"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CallParticipantPublic, CallSessionPublic } from "@/lib/calls/types";
import { getCallShareUrl } from "@/lib/calls/share-url";
import { acquireCallChannel, acquireDmChannel, releaseCallChannel, releaseDmChannel } from "@/lib/pusher-channel";
import { getPusherClient } from "@/lib/pusher-client";
import { emitCallSignal } from "@/lib/webrtc/emit-call-signal";
import { emitRoomSignal } from "@/lib/webrtc/emit-room-signal";
import {
  DM_CALL_EVENTS,
  ROOM_CALL_EVENTS,
  type CallIdPayload,
  type CallInvitePayload,
  type CallPhase,
  type CallType,
  type ParticipantEventPayload,
  type WebRtcTargetedIcePayload,
  type WebRtcTargetedSdpPayload,
} from "@/lib/webrtc/call-events";
import { getIceServers } from "@/lib/webrtc/ice-servers";

type RemotePeer = CallParticipantPublic & { stream: MediaStream | null; isMuted: boolean };

export function useCallSession({
  selfId,
  selfName,
  selfEmail,
  selfAvatar,
  conversationId,
  peerId,
}: {
  selfId: string;
  selfName: string;
  selfEmail: string;
  selfAvatar: string | null;
  conversationId?: string;
  peerId?: string;
}) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [callType, setCallType] = useState<CallType | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [incomingFromName, setIncomingFromName] = useState<string | null>(null);
  const [incomingSessionId, setIncomingSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<CallParticipantPublic[]>([]);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [pusherReady, setPusherReady] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const phaseRef = useRef<CallPhase>("idle");
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const joinedRoomRef = useRef(false);

  phaseRef.current = phase;
  sessionIdRef.current = sessionId;
  localStreamRef.current = localStream;

  const shareUrl = sessionId ? getCallShareUrl(sessionId) : null;

  const syncRemotePeers = useCallback((list: CallParticipantPublic[]) => {
    setRemotePeers((prev) => {
      const others = list.filter((p) => p.id !== selfId);
      return others.map((p) => {
        const existing = prev.find((r) => r.id === p.id);
        return { ...p, stream: existing?.stream ?? null, isMuted: existing?.isMuted ?? false };
      });
    });
    setFocusedParticipantId((cur) => {
      const others = list.filter((p) => p.id !== selfId);
      if (cur && others.some((p) => p.id === cur)) {
        return cur;
      }
      return others[0]?.id ?? null;
    });
  }, [selfId]);

  const cleanupMedia = useCallback(() => {
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    iceQueuesRef.current.clear();
    joinedRoomRef.current = false;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemotePeers([]);
    setParticipants([]);
    setFocusedParticipantId(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setSessionId(null);
    setIncomingSessionId(null);
    sessionIdRef.current = null;
  }, []);

  const endCallLocal = useCallback(() => {
    cleanupMedia();
    setPhase("idle");
    setCallType(null);
    setIncomingFromName(null);
  }, [cleanupMedia]);

  const flushIce = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queued = iceQueuesRef.current.get(peerId) ?? [];
    iceQueuesRef.current.delete(peerId);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // ignore
      }
    }
  }, []);

  const attachRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemotePeers((prev) => prev.map((r) => (r.id === peerId ? { ...r, stream } : r)));
    setPhase("active");
    setFocusedParticipantId((cur) => cur ?? peerId);
  }, []);

  const getOrCreatePc = useCallback(
    (peerId: string, stream: MediaStream, sid: string) => {
      let pc = pcsRef.current.get(peerId);
      if (pc) {
        return pc;
      }
      pc = new RTCPeerConnection({ iceServers: getIceServers() });
      stream.getTracks().forEach((track) => pc!.addTrack(track, stream));

      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (remote) {
          attachRemoteStream(peerId, remote);
        } else if (ev.track) {
          attachRemoteStream(peerId, new MediaStream([ev.track]));
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !sessionIdRef.current) {
          return;
        }
        void emitRoomSignal(sessionIdRef.current, ROOM_CALL_EVENTS.ICE, {
          targetId: peerId,
          candidate: ev.candidate.toJSON(),
        }).catch(() => undefined);
      };

      pcsRef.current.set(peerId, pc);
      return pc;
    },
    [attachRemoteStream],
  );

  const createOfferTo = useCallback(
    async (targetId: string) => {
      const sid = sessionIdRef.current;
      const stream = localStreamRef.current;
      if (!sid || !stream || targetId === selfId) {
        return;
      }
      const pc = getOrCreatePc(targetId, stream, sid);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await emitRoomSignal(sid, ROOM_CALL_EVENTS.OFFER, { targetId, sdp: offer });
      } catch {
        // ignore negotiation errors for a single peer
      }
    },
    [getOrCreatePc, selfId],
  );

  const handleOffer = useCallback(
    async (payload: WebRtcTargetedSdpPayload) => {
      if (payload.fromId === selfId || payload.targetId !== selfId || payload.sessionId !== sessionIdRef.current) {
        return;
      }
      const stream = localStreamRef.current;
      if (!stream) {
        return;
      }
      setPhase("connecting");
      const pc = getOrCreatePc(payload.fromId, stream, payload.sessionId);
      try {
        await pc.setRemoteDescription(payload.sdp);
        await flushIce(payload.fromId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await emitRoomSignal(payload.sessionId, ROOM_CALL_EVENTS.ANSWER, {
          targetId: payload.fromId,
          sdp: answer,
        });
      } catch {
        // ignore
      }
    },
    [flushIce, getOrCreatePc, selfId],
  );

  const handleAnswer = useCallback(
    async (payload: WebRtcTargetedSdpPayload) => {
      if (payload.fromId === selfId || payload.targetId !== selfId || payload.sessionId !== sessionIdRef.current) {
        return;
      }
      const pc = pcsRef.current.get(payload.fromId);
      if (!pc) {
        return;
      }
      try {
        await pc.setRemoteDescription(payload.sdp);
        await flushIce(payload.fromId, pc);
        setPhase("active");
      } catch {
        // ignore
      }
    },
    [flushIce, selfId],
  );

  const handleIce = useCallback(
    async (payload: WebRtcTargetedIcePayload) => {
      if (payload.fromId === selfId || payload.targetId !== selfId || payload.sessionId !== sessionIdRef.current) {
        return;
      }
      const pc = pcsRef.current.get(payload.fromId);
      if (!pc || !pc.remoteDescription) {
        const q = iceQueuesRef.current.get(payload.fromId) ?? [];
        q.push(payload.candidate);
        iceQueuesRef.current.set(payload.fromId, q);
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

  const joinRoom = useCallback(
    async (sid: string, type: CallType) => {
      const res = await fetch(`/api/calls/sessions/${encodeURIComponent(sid)}/join`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Could not join call");
      }
      const data = (await res.json()) as CallSessionPublic;
      setParticipants(data.participants);
      syncRemotePeers(data.participants);
      sessionIdRef.current = sid;
      setSessionId(sid);
      joinedRoomRef.current = true;
      setCallType(type);
      setPhase((p) => (p === "incoming" ? "connecting" : p));

      const others = data.participants.filter((p) => p.id !== selfId);
      window.setTimeout(() => {
        if (!localStreamRef.current || !sessionIdRef.current) {
          return;
        }
        for (const p of others) {
          if (!pcsRef.current.has(p.id)) {
            void createOfferTo(p.id);
          }
        }
      }, 900);
    },
    [createOfferTo, selfId, syncRemotePeers],
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

  // Room Pusher channel
  useEffect(() => {
    const sid = sessionId;
    if (!sid || phase === "idle" || phase === "incoming") {
      return;
    }

    const channel = acquireCallChannel(sid);
    if (!channel) {
      return;
    }

    const onJoined = (payload: ParticipantEventPayload) => {
      if (payload.fromId === selfId) {
        return;
      }
      setParticipants((prev) => {
        if (prev.some((p) => p.id === payload.participant.id)) {
          return prev;
        }
        return [...prev, payload.participant];
      });
      setRemotePeers((prev) => {
        if (prev.some((p) => p.id === payload.participant.id)) {
          return prev;
        }
        return [...prev, { ...payload.participant, stream: null, isMuted: false }];
      });
      if (joinedRoomRef.current && localStreamRef.current) {
        void createOfferTo(payload.fromId);
      }
    };

    const onLeft = (payload: { fromId: string }) => {
      if (payload.fromId === selfId) {
        return;
      }
      pcsRef.current.get(payload.fromId)?.close();
      pcsRef.current.delete(payload.fromId);
      setParticipants((prev) => prev.filter((p) => p.id !== payload.fromId));
      setRemotePeers((prev) => prev.filter((p) => p.id !== payload.fromId));
      setFocusedParticipantId((cur) => (cur === payload.fromId ? null : cur));
    };

    const onEnded = () => {
      endCallLocal();
    };

    channel.bind(ROOM_CALL_EVENTS.PARTICIPANT_JOINED, onJoined);
    channel.bind(ROOM_CALL_EVENTS.PARTICIPANT_LEFT, onLeft);
    channel.bind(ROOM_CALL_EVENTS.SESSION_ENDED, onEnded);
    channel.bind(ROOM_CALL_EVENTS.OFFER, handleOffer);
    channel.bind(ROOM_CALL_EVENTS.ANSWER, handleAnswer);
    channel.bind(ROOM_CALL_EVENTS.ICE, handleIce);

    return () => {
      channel.unbind(ROOM_CALL_EVENTS.PARTICIPANT_JOINED, onJoined);
      channel.unbind(ROOM_CALL_EVENTS.PARTICIPANT_LEFT, onLeft);
      channel.unbind(ROOM_CALL_EVENTS.SESSION_ENDED, onEnded);
      channel.unbind(ROOM_CALL_EVENTS.OFFER, handleOffer);
      channel.unbind(ROOM_CALL_EVENTS.ANSWER, handleAnswer);
      channel.unbind(ROOM_CALL_EVENTS.ICE, handleIce);
      releaseCallChannel(sid);
    };
  }, [sessionId, phase, selfId, createOfferTo, handleOffer, handleAnswer, handleIce, endCallLocal]);

  // DM invite channel
  useEffect(() => {
    if (!conversationId) {
      return;
    }
    const channel = acquireDmChannel(conversationId);
    if (!channel) {
      return;
    }

    const onInvite = (payload: CallInvitePayload) => {
      if (payload.fromId === selfId || phaseRef.current !== "idle") {
        return;
      }
      setIncomingSessionId(payload.sessionId);
      setIncomingFromName(payload.fromName);
      setCallType(payload.type);
      setPhase("incoming");
    };

    const onDecline = (payload: CallIdPayload) => {
      if (payload.fromId === selfId || payload.callId !== sessionIdRef.current) {
        return;
      }
      endCallLocal();
    };

    const onEnd = (payload: CallIdPayload) => {
      if (payload.fromId === selfId) {
        return;
      }
      endCallLocal();
    };

    channel.bind(DM_CALL_EVENTS.INVITE, onInvite);
    channel.bind(DM_CALL_EVENTS.DECLINE, onDecline);
    channel.bind(DM_CALL_EVENTS.END, onEnd);

    return () => {
      channel.unbind(DM_CALL_EVENTS.INVITE, onInvite);
      channel.unbind(DM_CALL_EVENTS.DECLINE, onDecline);
      channel.unbind(DM_CALL_EVENTS.END, onEnd);
      releaseDmChannel(conversationId);
    };
  }, [conversationId, selfId, endCallLocal]);

  useEffect(() => {
    setPusherReady(Boolean(getPusherClient()));
  }, []);

  const startCall = useCallback(
    async (type: CallType) => {
      if (phaseRef.current !== "idle") {
        return;
      }
      setCallType(type);
      setPhase("outgoing");
      try {
        await getMedia(type);
        const res = await fetch("/api/calls/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ callType: type, conversationId }),
        });
        if (!res.ok) {
          throw new Error("Could not create call");
        }
        const data = (await res.json()) as CallSessionPublic;
        sessionIdRef.current = data.id;
        setSessionId(data.id);
        setParticipants(data.participants);
        syncRemotePeers(data.participants);
        joinedRoomRef.current = true;

        if (conversationId && peerId) {
          await emitCallSignal(conversationId, DM_CALL_EVENTS.INVITE, {
            callId: data.id,
            sessionId: data.id,
            type,
            fromName: selfName,
          });
        }
      } catch {
        endCallLocal();
        throw new Error("Could not start call. Check microphone/camera permissions.");
      }
    },
    [conversationId, peerId, endCallLocal, getMedia, selfName, syncRemotePeers],
  );

  const acceptCall = useCallback(async () => {
    const sid = incomingSessionId;
    const type = callType;
    if (!sid || !type || phaseRef.current !== "incoming") {
      return;
    }
    setPhase("connecting");
    try {
      await getMedia(type);
      await joinRoom(sid, type);
      setIncomingSessionId(null);
    } catch {
      endCallLocal();
      throw new Error("Could not join call. Check microphone/camera permissions.");
    }
  }, [incomingSessionId, callType, endCallLocal, getMedia, joinRoom]);

  const joinSession = useCallback(
    async (sid: string, type: CallType) => {
      if (phaseRef.current !== "idle") {
        return;
      }
      setPhase("connecting");
      setCallType(type);
      try {
        await getMedia(type);
        await joinRoom(sid, type);
      } catch (e) {
        endCallLocal();
        throw e instanceof Error ? e : new Error("Could not join call");
      }
    },
    [endCallLocal, getMedia, joinRoom],
  );

  const declineCall = useCallback(async () => {
    const sid = incomingSessionId;
    if (sid && conversationId) {
      try {
        await emitCallSignal(conversationId, DM_CALL_EVENTS.DECLINE, { callId: sid });
      } catch {
        // ignore
      }
    }
    endCallLocal();
  }, [conversationId, endCallLocal, incomingSessionId]);

  const endCall = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (sid) {
      try {
        if (conversationId) {
          await emitCallSignal(conversationId, DM_CALL_EVENTS.END, { callId: sid });
        }
        await fetch(`/api/calls/sessions/${encodeURIComponent(sid)}/leave`, { method: "POST" });
        const hostRes = await fetch(`/api/calls/sessions/${encodeURIComponent(sid)}`);
        if (hostRes.ok) {
          const data = (await hostRes.json()) as CallSessionPublic;
          if (data.hostId === selfId) {
            await fetch(`/api/calls/sessions/${encodeURIComponent(sid)}/end`, { method: "POST" }).catch(() => undefined);
          }
        }
      } catch {
        // still end locally
      }
    }
    endCallLocal();
  }, [conversationId, endCallLocal, selfId]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    const audio = stream?.getAudioTracks()[0];
    if (!audio) {
      return;
    }
    audio.enabled = !audio.enabled;
    setIsMuted(!audio.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    const video = stream?.getVideoTracks()[0];
    if (!video) {
      return;
    }
    video.enabled = !video.enabled;
    setIsCameraOff(!video.enabled);
  }, []);

  const participantCount = participants.length;
  const focusedPeer = remotePeers.find((p) => p.id === focusedParticipantId) ?? remotePeers[0] ?? null;
  const inCallUi = phase === "outgoing" || phase === "connecting" || phase === "active";

  return {
    phase,
    callType,
    sessionId,
    shareUrl,
    incomingFromName,
    incomingSessionId,
    participants,
    remotePeers,
    participantCount,
    focusedPeer,
    focusedParticipantId,
    setFocusedParticipantId,
    localStream,
    isMuted,
    isCameraOff,
    pusherReady,
    inCallUi,
    isGroupCall: participantCount > 2,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    joinSession,
    toggleMute,
    toggleCamera,
    self: { id: selfId, name: selfName, email: selfEmail, avatar: selfAvatar },
  };
}
