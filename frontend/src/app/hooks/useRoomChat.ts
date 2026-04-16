import { useEffect, useState } from "react";
import { socket } from "../services/socketService";
import type { ChatMessage } from "../types/chat";
import { getJsonCookie } from "../utils/cookies";
import { getRoomById } from "../api/roomApi";

type StoredUser = {
  id?: string;
};

type JoinRequestEvent = {
  roomId: string;
  userId: string;
  participant?: unknown;
};

type RoomDecisionEvent = {
  roomId: string;
};

type UserJoinedEvent = {
  userId: string;
};

type SocketErrorEvent = {
  message?: string;
};

const USER_COOKIE_KEY = "echo_user";

function getCurrentUserId() {
  const user = getJsonCookie<StoredUser>(USER_COOKIE_KEY);
  return user?.id ?? "";
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
  const [lastJoinedUserId, setLastJoinedUserId] = useState("");
  const [lastError, setLastError] = useState("");

  // Wire socket lifecycle and message events into React state.
  useEffect(() => {
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
    }

    function onRejected(data: RoomDecisionEvent) {
      setLastRejectedRoomId(data.roomId);
    }

    function onUserJoined(data: UserJoinedEvent) {
      setLastJoinedUserId(data.userId);

      const roomId = joinedRoomId;
      if (!roomId) return;

      setMessages((prev) => [
        ...prev,
        {
          userId: "system",
          message: `${data.userId} joined room ${roomId}`,
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
  function joinRoom(roomId: string, userId?: string) {
    const resolvedUserId = userId?.trim() || getCurrentUserId();

    if (!resolvedUserId) return;

    setJoinedRoomId(roomId);
    socket.emit("joinRoom", { roomId, userId: resolvedUserId });
  }

  // Emit join request for a specific room.
  async function requestJoin(roomId: string, name: string, userId?: string) {
    const resolvedUserId = userId?.trim() || getCurrentUserId();

    socket.emit("requestJoin", {
      roomId,
      name,
      userId: resolvedUserId,
    });
  }

  // Owner emits approve action for a pending user.
  function approveUser(roomId: string, userId: string, ownerId?: string) {
    const resolvedOwnerId = ownerId?.trim() || getCurrentUserId();

    if (!resolvedOwnerId || !userId) return;

    socket.emit("approveUser", {
      roomId,
      userId,
      ownerId: resolvedOwnerId,
    });
  }

  // Owner emits reject action for a pending user.
  function rejectUser(roomId: string, userId: string, ownerId?: string) {
    const resolvedOwnerId = ownerId?.trim() || getCurrentUserId();

    if (!resolvedOwnerId || !userId) return;

    socket.emit("rejectUser", {
      roomId,
      userId,
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
    lastJoinedUserId,
    lastError,
    requestJoin,
    joinRoom,
    approveUser,
    rejectUser,
    sendMessage,
  };
}
