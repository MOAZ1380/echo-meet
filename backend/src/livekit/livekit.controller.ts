import { Controller, Get, Query } from '@nestjs/common';
import { LivekitService } from './livekit.service';

@Controller('livekit')
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Get('token')
  async getToken(
    @Query('userId') userId: string,
    @Query('roomId') roomId: string,
  ) {
    console.log('Generating token for userId:', userId, 'roomId:', roomId);
    const token = await this.livekitService.createToken(userId, roomId);
    return {
      token: token,
    };
  }
}
