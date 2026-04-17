import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeetingGateway } from './meeting/meeting.gateway';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { RoomModule } from './room/room.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { LivekitModule } from './livekit/livekit.module';
import { MeetingService } from './meeting/meeting.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RoomModule,
    PrismaModule,
    UserModule,
    AuthModule,
    EmailModule,
    LivekitModule,
  ],
  controllers: [AppController],
  providers: [AppService, MeetingGateway, MeetingService],
})
export class AppModule {}
