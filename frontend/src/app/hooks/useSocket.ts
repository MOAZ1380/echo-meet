import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Mock Socket.io hook for WebRTC signaling and real-time communication
 * In production, this would connect to an actual Socket.io server
 */

export interface Participant {
  id: string;
  name: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isSpeaking?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

export const useSocket = (meetingId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<any>(null);

  // Initialize socket connection (mock)
  useEffect(() => {
    if (meetingId) {
      // Simulate connection
      setTimeout(() => {
        setIsConnected(true);

        // Add mock participants
        const mockParticipants: Participant[] = [
          {
            id: "user-1",
            name: "You",
            isMicOn: true,
            isCameraOn: true,
          },
          {
            id: "user-2",
            name: "Sarah Johnson",
            isMicOn: true,
            isCameraOn: true,
            isSpeaking: false,
          },
          {
            id: "user-3",
            name: "Michael Chen",
            isMicOn: false,
            isCameraOn: true,
            isSpeaking: false,
          },
          {
            id: "user-4",
            name: "Emily Davis",
            isMicOn: true,
            isCameraOn: false,
            isSpeaking: false,
          },
        ];

        setParticipants(mockParticipants);
      }, 1000);

      return () => {
        // Cleanup socket connection
        setIsConnected(false);
        setParticipants([]);
        setMessages([]);
      };
    }
  }, [meetingId]);

  // Join meeting
  const joinMeeting = useCallback(
    (userName: string) => {
      // In production, this would emit a 'join-meeting' event to the server
      console.log("Joining meeting:", meetingId, "as", userName);
    },
    [meetingId],
  );

  // Leave meeting
  const leaveMeeting = useCallback(() => {
    // In production, this would emit a 'leave-meeting' event
    console.log("Leaving meeting:", meetingId);
    setIsConnected(false);
  }, [meetingId]);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: "user-1",
      senderName: "You",
      message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // In production, emit message to server
    console.log("Sending message:", message);
  }, []);

  // Toggle participant mic (for demo purposes)
  const toggleParticipantMic = useCallback((participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, isMicOn: !p.isMicOn } : p,
      ),
    );
  }, []);

  // Toggle participant camera (for demo purposes)
  const toggleParticipantCamera = useCallback((participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, isCameraOn: !p.isCameraOn } : p,
      ),
    );
  }, []);

  // Simulate speaking detection (random for demo)
  useEffect(() => {
    if (participants.length > 0) {
      const interval = setInterval(() => {
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            isSpeaking: p.isMicOn && Math.random() > 0.8,
          })),
        );
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [participants.length]);

  return {
    isConnected,
    participants,
    messages,
    joinMeeting,
    leaveMeeting,
    sendMessage,
    toggleParticipantMic,
    toggleParticipantCamera,
  };
};
