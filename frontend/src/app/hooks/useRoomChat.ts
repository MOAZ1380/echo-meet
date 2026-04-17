import { useEffect, useState } from "react";
import { socket, syncSocketIdentity } from "../services/socketService";
import type { ChatMessage } from "../types/chat";
import { getJsonCookie } from "../utils/cookies";

type StoredUser = {
  id?: string;
};

type JoinRequestEvent = {
  roomId: string;
  userId: string;
  participant: {
    id: string;
    name: string;
    status: string;
  };
};

type RoomDecisionEvent = {
  roomId: string;
  userId?: string;
  reason?: string;
  participantId: string;
};

type UserJoinedEvent = {
  userId?: string;
  participantId: string;
};

type SocketErrorEvent = {
  message?: string;
};

const USER_COOKIE_KEY = "echo_user";

function getCurrentUserId() {
  const user = getJsonCookie<StoredUser>(USER_COOKIE_KEY);
  return user?.id ?? undefined;
}

// Legacy socket-based room chat hook.
export function useRoomChat() {
  const [socketStatus, setSocketStatus] = useState<
    "connected" | "disconnected"
  >(socket.connected ? "connected" : "disconnected");
  const [joinedRoomId, setJoinedRoomId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestEvent[]>([]);
  const [lastApprovedRoomId, setLastApprovedRoomId] = useState("");
  const [lastRejectedRoomId, setLastRejectedRoomId] = useState("");
  const [lastRejectedReason, setLastRejectedReason] = useState("");
  const [lastJoinedUserId, setLastJoinedUserId] = useState("");
  const [lastError, setLastError] = useState("");

  // Wire socket lifecycle and message events into React state.
  useEffect(() => {
    syncSocketIdentity();

    function onConnect() {
      setSocketStatus("connected");
    }

    function onDisconnect() {
      setSocketStatus("disconnected");
    }

    function onNewMessage(data: ChatMessage) {
      setMessages((prev) => [...prev, data]);
    }

    function onJoinRequest(data: JoinRequestEvent) {
      setJoinRequests((prev) => [...prev, data]);
    }

    function onApproved(data: RoomDecisionEvent) {
      setLastApprovedRoomId(data.roomId);

      setJoinRequests((prev) => {
        if (!data.userId) {
          return prev.filter((req) => req.roomId !== data.roomId);
        }

        return prev.filter(
          (req) =>
            !(
              req.roomId === data.roomId &&
              req.participant.id === data.participantId
            ),
        );
      });
    }
    function onRejected(data: RoomDecisionEvent) {
      console.log("❌ rejected event received", data);
      setLastRejectedRoomId(data.roomId);
      setLastRejectedReason(
        data.reason ?? "غير مسموح لك بالانضمام إلى هذه الغرفة.",
      );

      setJoinRequests((prev) => {
        if (!data.userId) {
          return prev.filter((req) => req.roomId !== data.roomId);
        }

        return prev.filter(
          (req) =>
            !(
              req.roomId === data.roomId &&
              req.participant.id === data.participantId
            ),
        );
      });
    }

    function onUserJoined(data: UserJoinedEvent) {
      setLastJoinedUserId(data.participantId);

      const roomId = joinedRoomId;
      if (!roomId) return;

      setMessages((prev) => [
        ...prev,
        {
          userId: "system",
          message: `${data.participantId} joined room ${roomId}`,
        },
      ]);
    }

    function onSocketError(data: SocketErrorEvent) {
      setLastError(data.message ?? "Unknown socket error");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:join-request", onJoinRequest);
    socket.on("room:approved", onApproved);
    socket.on("room:rejected", onRejected);
    socket.on("userJoined", onUserJoined);
    socket.on("error", onSocketError);
    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:join-request", onJoinRequest);
      socket.off("room:approved", onApproved);
      socket.off("room:rejected", onRejected);
      socket.off("userJoined", onUserJoined);
      socket.off("error", onSocketError);
      socket.off("newMessage", onNewMessage);
    };
  }, [joinedRoomId]);

  // Join the legacy socket room channel.
  function joinRoom(roomId: string, participantId: string) {
    const resolvedParticipantId = participantId?.trim() || getCurrentUserId();

    if (!resolvedParticipantId) return;

    setJoinedRoomId(roomId);
    socket.emit("joinRoom", { roomId, participantId: resolvedParticipantId });
  }

  // Emit join request for a specific room.
  async function requestJoin(
    roomId: string,
    name: string,
    participantId: string,
  ) {
    const resolvedParticipantId = participantId.trim();
    syncSocketIdentity(resolvedParticipantId);
    console.log("🚀 requesting join", roomId, name, resolvedParticipantId);
    socket.emit("requestJoin", {
      roomId,
      name,
      participantId: resolvedParticipantId,
    });
  }

  // Owner emits approve action for a pending user.
  function approveUser(
    roomId: string,
    participantId: string,
    ownerId?: string,
  ) {
    console.log("✅ approving user", roomId, participantId, ownerId);
    const resolvedOwnerId = ownerId || getCurrentUserId();

    if (!resolvedOwnerId) {
      console.error("❌ Cannot approve user: owner ID not found");
      return;
    }

    setJoinRequests((prev) =>
      prev.filter(
        (req) =>
          !(req.roomId === roomId && req.participant.id === participantId),
      ),
    );

    socket.emit("approveUser", {
      roomId,
      participantId,
      ownerId: resolvedOwnerId,
    });
  }

  // Owner emits reject action for a pending user.
  function rejectUser(roomId: string, participantId: string, ownerId?: string) {
    const resolvedOwnerId = ownerId || getCurrentUserId();

    if (!resolvedOwnerId || !participantId) {
      console.error(
        "❌ Cannot reject user: missing owner ID or participant ID",
      );
      return;
    }

    setJoinRequests((prev) =>
      prev.filter(
        (req) =>
          !(req.roomId === roomId && req.participant.id === participantId),
      ),
    );

    socket.emit("rejectUser", {
      roomId,
      participantId,
      ownerId: resolvedOwnerId,
    });
  }

  // Send a text message through the socket room channel.
  function sendMessage(message: string) {
    if (!joinedRoomId || !message.trim()) return;

    socket.emit("sendMessage", {
      roomId: joinedRoomId,
      message: message.trim(),
    });
  }

  return {
    socketStatus,
    joinedRoomId,
    messages,
    joinRequests,
    lastApprovedRoomId,
    lastRejectedRoomId,
    lastRejectedReason,
    lastJoinedUserId,
    lastError,
    requestJoin,
    joinRoom,
    approveUser,
    rejectUser,
    sendMessage,
  };
}
