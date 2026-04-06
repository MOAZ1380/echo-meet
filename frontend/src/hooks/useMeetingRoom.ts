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

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const roomIdRef = useRef("");

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    setMicEnabled(false);
    setCamEnabled(false);

    return stream;
  }, []);

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
    stream.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setCamEnabled(nextEnabled);
  }, [camEnabled]);

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
        const parsed = JSON.parse(data.message) as {
          type?: string;
          text?: string;
          sender?: string;
        };

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
    ensureLocalMedia,
    joinMeeting,
    sendChatMessage,
    toggleMic,
    toggleCamera,
    leaveMeeting,
  };
}
