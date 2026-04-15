export type RoomStatus = "active" | "ended" | string;
export type ParticipantStatus = "pending" | "approved" | "rejected";

export type RoomUser = {
  id: string;
  email?: string;
  name?: string;
};

export type RoomParticipant = {
  roomId: string;
  userId: string;
  status: ParticipantStatus;
  user?: RoomUser;
};

export type Room = {
  code: string;
  id: string;
  startTime: string;
  status: RoomStatus;
  ownerId: string;
  owner?: RoomUser;
  participants?: RoomParticipant[];
};

export type CreateRoomPayload = {
  startTime?: string;
  status?: RoomStatus;
};

export type UpdateRoomPayload = {
  startTime?: string;
  status?: RoomStatus;
};

export type ServiceResult = {
  success: boolean;
};

// Socket event types
export type JoinRequestEvent = {
  roomId: string;
  userId: string;
  participant?: RoomParticipant;
};

export type RoomDecisionEvent = {
  roomId: string;
};

export type UserJoinedEvent = {
  userId: string;
};

export type SocketErrorEvent = {
  message?: string;
};

// Socket emit payloads
export type RequestJoinPayload = {
  roomId: string;
  userId: string;
};

export type ApproveUserPayload = {
  roomId: string;
  userId: string;
  ownerId: string;
};

export type RejectUserPayload = {
  roomId: string;
  userId: string;
  ownerId: string;
};

export type JoinRoomPayload = {
  roomId: string;
  userId: string;
};

export type SocketResponse = {
  success: boolean;
};
