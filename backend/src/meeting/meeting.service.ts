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

  /**
   * Normalizes handshake query values that may be `string`, `string[]`, or missing.
   *
   * @param value Raw query value from socket handshake.
   * @returns Single string value when available, otherwise `undefined`.
   */
  private asQueryString(value: unknown) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
  }

  /**
   * Extracts private channel ids used for direct socket notifications.
   *
   * @param query Socket handshake query object.
   * @returns User and participant channel ids when present.
   */
  resolvePrivateChannelIds(query: Record<string, unknown>) {
    const userId = this.asQueryString(query.userId);
    const participantId = this.asQueryString(query.participantId);

    return { userId, participantId };
  }

  /**
   * Creates or updates a pending join request and returns owner routing info.
   *
   * @param data Join request payload.
   * @returns Join request metadata used by the gateway emit layer.
   */
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

  /**
   * Approves a participant for the requested room.
   *
   * @param data Decision payload containing room, owner, and participant ids.
   * @returns Minimal approved payload for gateway broadcasts.
   */
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

  /**
   * Rejects a participant for the requested room.
   *
   * @param data Decision payload containing room, owner, and participant ids.
   * @returns Minimal rejected payload for gateway broadcasts.
   */
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

  /**
   * Validates that a participant exists in the room with `approved` status.
   *
   * @param roomId External room reference (id or code).
   * @param participantId Participant id attempting to join.
   * @returns Normalized room join data or `null` when participant is not approved.
   */
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
