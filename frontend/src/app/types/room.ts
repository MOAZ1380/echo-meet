import { apiRequest, authHeaders } from "../api/client";

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

export function getRooms(token: string) {
  return apiRequest<Room[]>("/rooms", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function createRoom(token: string, payload: CreateRoomPayload = {}) {
  return apiRequest<Room>("/rooms", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getRoomById(token: string, roomId: string) {
  return apiRequest<Room>(`/rooms/${roomId}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function updateRoom(
  token: string,
  roomId: string,
  payload: UpdateRoomPayload,
) {
  return apiRequest<Room>(`/rooms/${roomId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteRoom(token: string, roomId: string) {
  return apiRequest<Room>(`/rooms/${roomId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function requestJoinRoom(token: string, roomId: string) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/join`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function getPendingUsers(token: string, roomId: string) {
  return apiRequest<RoomParticipant[]>(`/rooms/${roomId}/pending`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function approveUser(token: string, roomId: string, userId: string) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/approve/${userId}`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

export function rejectUser(token: string, roomId: string, userId: string) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/reject/${userId}`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

export function getRoomToken(token: string, roomId: string) {
  return apiRequest<string>(`/rooms/${roomId}/token`, {
    method: "GET",
    headers: authHeaders(token),
  });
}
