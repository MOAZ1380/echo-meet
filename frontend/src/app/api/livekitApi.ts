import { apiRequest } from "./client";

type LivekitTokenResponse = {
  token: string;
};

export function getLivekitToken(userId: string, roomId: string) {
  const search = new URLSearchParams({ userId, roomId });
  return apiRequest<LivekitTokenResponse>(
    `/livekit/token?${search.toString()}`,
  );
}
