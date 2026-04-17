import { io } from "socket.io-client";
import { getCookie, getJsonCookie } from "../utils/cookies";

const user = getJsonCookie<{ id?: string }>("echo_user");
const guestParticipant = getCookie("echo_participant_id");
const socketUrl = "http://localhost:8000";

export const socket = io(socketUrl, {
  query: {
    userId: user?.id,
    participantId: guestParticipant,
  },
});

export function syncSocketIdentity(participantId?: string) {
  const currentUser = getJsonCookie<{ id?: string }>("echo_user");
  const userId = currentUser?.id?.trim() || undefined;
  const resolvedParticipantId =
    participantId?.trim() || getCookie("echo_participant_id") || undefined;
  const currentQueryUserId = socket.io.opts.query?.userId as string | undefined;
  const currentQueryParticipantId = socket.io.opts.query?.participantId as
    | string
    | undefined;

  if (
    currentQueryUserId === userId &&
    currentQueryParticipantId === resolvedParticipantId
  ) {
    return;
  }

  socket.io.opts.query = {
    userId,
    participantId: resolvedParticipantId,
  };

  if (socket.connected) {
    socket.disconnect().connect();
  } else if (userId || resolvedParticipantId) {
    socket.connect();
  }
}
