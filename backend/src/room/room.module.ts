import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LivekitModule } from 'src/livekit/livekit.module';
import { LivekitService } from 'src/livekit/livekit.service';

@Module({
  imports: [
    PrismaModule,
    LivekitModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
    }),
  ],
  providers: [RoomService, LivekitService, JwtAuthGuard],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
