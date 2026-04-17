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

/**
 * Fetches all rooms visible to the authenticated user.
 */
export function getRooms(token: string) {
  return apiRequest<Room[]>("/rooms", {
    method: "GET",
    headers: authHeaders(token),
  });
}

/**
 * Creates a new room owned by the authenticated user.
 */
export function createRoom(token: string) {
  return apiRequest<Room>("/rooms", {
    method: "POST",
    headers: authHeaders(token),
  });
}

/**
 * Fetches one room by id or public code.
 */
export function getRoomById(roomId: string) {
  return apiRequest<Room>(`/rooms/${roomId}`, {
    method: "GET",
  });
}

/**
 * Updates mutable room attributes.
 */
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

/**
 * Deletes a room owned by the authenticated user.
 */
export function deleteRoom(token: string, roomId: string) {
  return apiRequest<Room>(`/rooms/${roomId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

/**
 * Sends a join request for authenticated participants.
 */
export function requestJoinRoom(token: string, roomId: string, name: string) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/join`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}

/**
 * Sends a join request for guest participants.
 */
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

/**
 * Returns all pending room join requests (owner only).
 */
export function getPendingUsers(token: string, roomId: string) {
  return apiRequest<RoomParticipant[]>(`/rooms/${roomId}/pending`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

/**
 * Approves one pending room participant (owner only).
 */
export function approveUser(token: string, roomId: string, userId: string) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/approve/${userId}`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

/**
 * Rejects one pending room participant (owner only).
 */
export function rejectUser(token: string, roomId: string, userId: string) {
  return apiRequest<RoomParticipant>(`/rooms/${roomId}/reject/${userId}`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

/**
 * Requests a room-scoped access token for live session join.
 */
export function getRoomToken(token: string, roomId: string) {
  return apiRequest<string>(`/rooms/${roomId}/token`, {
    method: "GET",
    headers: authHeaders(token),
  });
}
