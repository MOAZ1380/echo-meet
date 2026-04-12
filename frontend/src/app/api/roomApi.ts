import { apiRequest, authHeaders } from "./client";
import type { Room } from "../types/room";

export function getRooms(token: string) {
  return apiRequest<Room[]>("/room", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function createRoom(token: string) {
  return apiRequest<Room>("/room", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
}

export function getRoomById(token: string, roomId: string) {
  return apiRequest<Room>(`/room/${roomId}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}
