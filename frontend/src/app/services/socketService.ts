import { io } from "socket.io-client";
import { getJsonCookie } from "../utils/cookies";

const user = getJsonCookie<{ id?: string }>("echo_user");
const socketUrl = "http://localhost:8000";

export const socket = io(socketUrl, {
  query: {
    userId: user?.id,
  },
});

export function syncSocketIdentity() {
  const currentUser = getJsonCookie<{ id?: string }>("echo_user");
  const userId = currentUser?.id?.trim() || undefined;
  const currentQueryUserId = socket.io.opts.query?.userId as string | undefined;

  if (currentQueryUserId === userId) {
    return;
  }

  socket.io.opts.query = { userId };

  if (socket.connected) {
    socket.disconnect().connect();
  } else if (userId) {
    socket.connect();
  }
}
