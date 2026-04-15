import { apiRequest, authHeaders } from "../api/client";
import type {
  ApproveUserPayload,
  CreateRoomPayload,
  JoinRequestEvent,
  JoinRoomPayload,
  ParticipantStatus,
  RejectUserPayload,
  RequestJoinPayload,
  Room,
  RoomDecisionEvent,
  RoomParticipant,
  RoomStatus,
  SocketErrorEvent,
  SocketResponse,
  UpdateRoomPayload,
  UserJoinedEvent,
} from "../types/room";

export type {
  ApproveUserPayload,
  CreateRoomPayload,
  JoinRequestEvent,
  JoinRoomPayload,
  ParticipantStatus,
  RejectUserPayload,
  RequestJoinPayload,
  Room,
  RoomDecisionEvent,
  RoomParticipant,
  RoomStatus,
  SocketErrorEvent,
  SocketResponse,
  UpdateRoomPayload,
  UserJoinedEvent,
} from "../types/room";

export function getRooms(token: string) {
  return apiRequest<Room[]>("/rooms", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function createRoom(token: string) {
  return apiRequest<Room>("/rooms", {
    method: "POST",
    headers: authHeaders(token),
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

export function requestJoinRoom(token: string, roomId: string, name: string) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/join`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}

export function requestGuestJoinRoom(
  roomId: string,
  token: undefined,
  name: string,
) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/guest-join`, {
    method: "POST",
    body: JSON.stringify({ name }),
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
