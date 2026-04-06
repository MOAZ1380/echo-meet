import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../services/socketService";

type RoomChatMessage = {
  id: string;
  sender: string;
  text: string;
};

type RemoteParticipant = {
  id: string;
  stream: MediaStream;
};

type ChatPayload = {
  type?: string;
  text?: string;
  sender?: string;
};

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useMeetingRoom(displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipant[]
  >([]);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
  const [joinedRoomId, setJoinedRoomId] = useState("");
  const [socketStatus, setSocketStatus] = useState<
    "connected" | "disconnected"
  >(socket.connected ? "connected" : "disconnected");
  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const roomIdRef = useRef("");

  const createPreviewStream = useCallback(
    (baseStream: MediaStream, videoTrack: MediaStreamTrack | null) => {
      const audioTracks = baseStream.getAudioTracks();
      const tracks = videoTrack
        ? [...audioTracks, videoTrack]
        : [...audioTracks];
      return new MediaStream(tracks);
    },
    [],
  );

  const replaceOutgoingVideoTrack = useCallback(
    async (track: MediaStreamTrack | null) => {
      const tasks: Promise<void>[] = [];

      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((item) => item.track && item.track.kind === "video");

        if (!sender) return;

        tasks.push(sender.replaceTrack(track));
      });

      await Promise.all(tasks);
    },
    [],
  );

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    stream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });

    stream.getVideoTracks().forEach((track) => {
      track.enabled = false;
    });

    localStreamRef.current = stream;
    setLocalStream(
      createPreviewStream(stream, stream.getVideoTracks()[0] || null),
    );
    setMicEnabled(false);
    setCamEnabled(false);

    return stream;
  }, [createPreviewStream]);

  const upsertRemoteStream = useCallback(
    (participantId: string, stream: MediaStream) => {
      setRemoteParticipants((prev) => {
        const index = prev.findIndex((item) => item.id === participantId);
        if (index === -1) {
          return [...prev, { id: participantId, stream }];
        }

        const next = [...prev];
        next[index] = { id: participantId, stream };
        return next;
      });
    },
    [],
  );

  const removeRemoteParticipant = useCallback((participantId: string) => {
    setRemoteParticipants((prev) =>
      prev.filter((item) => item.id !== participantId),
    );
  }, []);

  const buildPeerConnection = useCallback(
    async (peerId: string) => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(peerId, pc);

      const stream = await ensureLocalMedia();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;
        upsertRemoteStream(peerId, remoteStream);
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit("ice-candidate", {
          to: peerId,
          candidate: event.candidate,
        });
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (
          state === "disconnected" ||
          state === "failed" ||
          state === "closed"
        ) {
          peerConnectionsRef.current.delete(peerId);
          removeRemoteParticipant(peerId);
          pc.close();
        }
      };

      return pc;
    },
    [ensureLocalMedia, removeRemoteParticipant, upsertRemoteStream],
  );

  const joinMeeting = useCallback(
    async (roomId: string) => {
      await ensureLocalMedia();
      roomIdRef.current = roomId;
      socket.emit("joinRoom", { roomId });
    },
    [ensureLocalMedia],
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      const roomId = roomIdRef.current;
      if (!roomId || !text.trim()) return;

      socket.emit("sendMessage", {
        roomId,
        message: JSON.stringify({
          type: "chat",
          text,
          sender: displayName || "Guest",
        }),
      });
    },
    [displayName],
  );

  const stopScreenShare = useCallback(async () => {
    const baseStream = localStreamRef.current;
    if (!baseStream) return;

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    const cameraTrack = camEnabled
      ? baseStream.getVideoTracks()[0] || null
      : null;
    await replaceOutgoingVideoTrack(cameraTrack);
    setLocalStream(createPreviewStream(baseStream, cameraTrack));
    setIsScreenSharing(false);
  }, [camEnabled, createPreviewStream, replaceOutgoingVideoTrack]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }

    const baseStream = await ensureLocalMedia();
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    if (!screenTrack) return;

    screenStreamRef.current = screenStream;

    screenTrack.onended = () => {
      void stopScreenShare();
    };

    await replaceOutgoingVideoTrack(screenTrack);
    setLocalStream(createPreviewStream(baseStream, screenTrack));
    setIsScreenSharing(true);
  }, [
    createPreviewStream,
    ensureLocalMedia,
    isScreenSharing,
    replaceOutgoingVideoTrack,
    stopScreenShare,
  ]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextEnabled = !micEnabled;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setMicEnabled(nextEnabled);
  }, [micEnabled]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextEnabled = !camEnabled;
    const cameraTrack = stream.getVideoTracks()[0] || null;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });

    if (!isScreenSharing) {
      void replaceOutgoingVideoTrack(nextEnabled ? cameraTrack : null);
      setLocalStream(
        createPreviewStream(stream, nextEnabled ? cameraTrack : null),
      );
    }

    setCamEnabled(nextEnabled);
  }, [
    camEnabled,
    createPreviewStream,
    isScreenSharing,
    replaceOutgoingVideoTrack,
  ]);

  const leaveMeeting = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    setRemoteParticipants([]);
    setJoinedRoomId("");
    roomIdRef.current = "";

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    function onConnect() {
      setSocketStatus("connected");
    }

    function onDisconnect() {
      setSocketStatus("disconnected");
    }

    async function onUserJoined(data: { userId: string }) {
      const peerId = data.userId;
      if (!peerId || peerId === socket.id) return;

      const pc = await buildPeerConnection(peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", {
        roomId: roomIdRef.current,
        to: peerId,
        offer,
      });
    }

    async function onOffer(data: {
      offer: RTCSessionDescriptionInit;
      from: string;
    }) {
      const pc = await buildPeerConnection(data.from);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", {
        to: data.from,
        answer,
      });
    }

    async function onAnswer(data: {
      answer: RTCSessionDescriptionInit;
      from: string;
    }) {
      const pc = peerConnectionsRef.current.get(data.from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    async function onIceCandidate(data: {
      candidate: RTCIceCandidateInit;
      from: string;
    }) {
      const pc = peerConnectionsRef.current.get(data.from);
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }

    function onJoinedRoom(data: { roomId: string }) {
      setJoinedRoomId(data.roomId);
    }

    function onNewMessage(data: { userId: string; message: string }) {
      try {
        const parsed = JSON.parse(data.message) as ChatPayload;

        if (parsed.type !== "chat" || !parsed.text) return;

        const text = parsed.text;

        setChatMessages((prev) => [
          ...prev,
          {
            id: `${data.userId}-${Date.now()}-${Math.random()}`,
            sender: parsed.sender || data.userId.slice(0, 6),
            text,
          },
        ]);
      } catch {
        // Ignore non-chat payloads.
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("joinedRoom", onJoinedRoom);
    socket.on("userJoined", onUserJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("joinedRoom", onJoinedRoom);
      socket.off("userJoined", onUserJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("newMessage", onNewMessage);
    };
  }, [buildPeerConnection]);

  useEffect(() => {
    return () => {
      leaveMeeting();
    };
  }, [leaveMeeting]);

  return {
    localStream,
    remoteParticipants,
    chatMessages,
    joinedRoomId,
    socketStatus,
    micEnabled,
    camEnabled,
    isScreenSharing,
    ensureLocalMedia,
    joinMeeting,
    sendChatMessage,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    leaveMeeting,
  };
}
