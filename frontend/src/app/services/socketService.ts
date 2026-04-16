import { io } from "socket.io-client";
import { getJsonCookie } from "../utils/cookies";

const user = getJsonCookie<{ id?: string }>("echo_user");

export const socket = io("http://localhost:8000", {
  query: {
    userId: user?.id,
  },
});
