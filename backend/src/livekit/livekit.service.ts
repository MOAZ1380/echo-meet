import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  async createToken(userId: string, roomId: string) {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: userId,
      },
    );
    console.log(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
    });
    console.log(await at.toJwt());
    const token = await at.toJwt();

    return token;
  }
}
