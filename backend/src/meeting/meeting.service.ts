import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../room/room.service';

type RequestJoinPayload = {
  roomId: string;
  name: string;
  participantId: string;
};

type RoomDecisionPayload = {
  roomId: string;
  participantId: string;
  ownerId: string;
};

@Injectable()
export class MeetingService {
  constructor(
    private readonly roomService: RoomService,
    private readonly prisma: PrismaService,
  ) {}

  // Normalize socket query values that can be string|string[]|undefined.
  private asQueryString(value: unknown) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
  }

  resolvePrivateChannelIds(query: Record<string, unknown>) {
    const userId = this.asQueryString(query.userId);
    const participantId = this.asQueryString(query.participantId);

    return { userId, participantId };
  }

  async requestJoin(data: RequestJoinPayload) {
    const participant = await this.roomService.requestJoin(
      data.roomId,
      data.name,
      data.participantId,
    );

    const room = await this.roomService.findOne(data.roomId);

    return {
      roomId: data.roomId,
      ownerId: room.ownerId,
      participantId: data.participantId,
      participant,
    };
  }

  async approveUser(data: RoomDecisionPayload) {
    await this.roomService.approveUser(
      data.roomId,
      data.participantId,
      data.ownerId,
    );

    return {
      roomId: data.roomId,
      participantId: data.participantId,
      ownerId: data.ownerId,
    };
  }

  async rejectUser(data: RoomDecisionPayload) {
    await this.roomService.rejectUser(
      data.roomId,
      data.participantId,
      data.ownerId,
    );

    return {
      roomId: data.roomId,
      participantId: data.participantId,
    };
  }

  async validateJoinRoom(roomId: string, participantId: string) {
    const room = await this.roomService.findOne(roomId);

    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        roomId: room.id,
        id: participantId,
        status: 'approved',
      },
    });

    if (!participant) {
      return null;
    }

    return {
      roomId: room.id,
      participantId,
    };
  }
}
