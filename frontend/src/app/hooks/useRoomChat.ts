import { useEffect, useState } from "react";
import { socket } from "../services/socketService";
import type { ChatMessage } from "../types/chat";

export function useRoomChat() {
  const [socketStatus, setSocketStatus] = useState<
    "connected" | "disconnected"
  >(socket.connected ? "connected" : "disconnected");
  const [joinedRoomId, setJoinedRoomId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    function onConnect() {
      setSocketStatus("connected");
    }

    function onDisconnect() {
      setSocketStatus("disconnected");
    }

    function onJoinedRoom(data: { roomId: string }) {
      setJoinedRoomId(data.roomId);
      setMessages([]);
    }

    function onNewMessage(data: ChatMessage) {
      setMessages((prev) => [...prev, data]);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("joinedRoom", onJoinedRoom);
    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("joinedRoom", onJoinedRoom);
      socket.off("newMessage", onNewMessage);
    };
  }, []);

  function joinRoom(roomId: string) {
    socket.emit("joinRoom", { roomId });
  }

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
    joinRoom,
    sendMessage,
  };
}
