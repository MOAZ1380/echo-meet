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
