import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomStatus } from '@prisma/client';
import { LivekitService } from '../livekit/livekit.service';
import { nanoid } from 'nanoid';

@Injectable()
/**
 * Business logic for room lifecycle, membership moderation, and token issuance.
 */
export class RoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly livekitService: LivekitService,
  ) {}

  /**
   * Create a new room for the provided owner.
   *
   * Rules:
   * - The owner user must exist.
   * - `startTime` defaults to now if not provided.
   * - `status` defaults to `RoomStatus.active`.
   *
   * @param data Room creation payload.
   * @param userId Authenticated owner id.
   * @throws NotFoundException If user does not exist.
   * @returns Newly created room.
   */
  async createRoom(data: CreateRoomDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const room = await this.prisma.room.create({
      data: {
        code: nanoid(10),
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        status: data.status ?? RoomStatus.active,
        ownerId: userId,
      },
    });

    return room;
  }

  /**
   * Fetch all rooms.
   *
   * Includes room owner and participant relations.
   * @returns Array of rooms.
   */
  async findAll() {
    return this.prisma.room.findMany({
      include: {
        owner: true,
        participants: true,
      },
    });
  }

  /**
   * Fetch a room by id.
   *
   * Includes room owner and participant relations.
   * @param id Room id.
   * @throws NotFoundException If room does not exist.
   * @returns Room record.
   */
  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { code: id },
      include: {
        owner: true,
        participants: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  /**
   * Update room data (owner only).
   *
   * Rules:
   * - Request body must not be empty.
   * - Room must belong to authenticated owner.
   * - Only provided fields are updated.
   *
   * @param id Room id.
   * @param data Partial update payload.
   * @param userId Authenticated owner id.
   * @throws BadRequestException If body is empty.
   * @throws NotFoundException If room not found for owner.
   * @returns Updated room.
   */
  async update(id: string, data: UpdateRoomDto, userId: string) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    const room = await this.prisma.room.findFirst({
      where: { id, ownerId: userId },
    });

    if (!room) {
      throw new NotFoundException('Room not found for this user');
    }

    return this.prisma.room.update({
      where: { id },
      data: {
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        status: data.status,
      },
    });
  }

  /**
   * Delete a room (owner only).
   *
   * @param id Room id.
   * @param userId Authenticated owner id.
   * @throws NotFoundException If room not found for owner.
   * @returns Deleted room.
   */
  async remove(id: string, userId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, ownerId: userId },
    });

    if (!room) {
      throw new NotFoundException('Room not found for this user');
    }

    return this.prisma.room.delete({
      where: { id },
    });
  }

  /**
   * Request to join a room.
   *
   * Rules:
   * - If `userId` is provided, creates a pending participant record linked to the user.
   * - If no `userId`, creates a guest participant record with a generated name.
   *
   * @param roomId Target room id.
   * @param userId Optional authenticated user id (null for guests).
   * @param name Optional name for the participant (used for guests or can override user name).
   * @returns Newly created pending participant record.
   */
  async requestJoin(roomId: string, name?: string, userId?: string) {
    if (userId) {
      // registered user
      return this.prisma.roomParticipant.create({
        data: {
          roomId,
          name: name || 'User',
          userId,
        },
      });
    } else {
      // guest
      return this.prisma.roomParticipant.create({
        data: {
          roomId,
          name: name || `Guest-${Date.now()}`,
        },
      });
    }
  }

  /**
   * Get all pending join requests for a room (owner only).
   *
   * @param roomId Target room id.
   * @param ownerId Authenticated owner id.
   * @throws BadRequestException If requester is not the room owner.
   * @returns Pending participants including user data.
   */
  async getPendingUsers(roomId: string, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.ownerId !== ownerId) {
      throw new BadRequestException('Not allowed');
    }

    return this.prisma.roomParticipant.findMany({
      where: {
        roomId,
        status: 'pending',
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Approve a pending user for a room (owner only).
   *
   * @param roomId Target room id.
   * @param targetUserId User id to approve.
   * @param ownerId Authenticated owner id.
   * @throws BadRequestException If requester is not the room owner.
   * @returns Updated participant record with `approved` status.
   */
  async approveUser(roomId: string, targetUserId: string, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.ownerId !== ownerId) {
      throw new BadRequestException('Not allowed');
    }

    return this.prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
      data: {
        status: 'approved',
      },
    });
  }

  /**
   * Reject a pending user for a room (owner only).
   *
   * @param roomId Target room id.
   * @param targetUserId User id to reject.
   * @param ownerId Authenticated owner id.
   * @throws BadRequestException If requester is not the room owner.
   * @returns Updated participant record with `rejected` status.
   */
  async rejectUser(roomId: string, targetUserId: string, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.ownerId !== ownerId) {
      throw new BadRequestException('Not allowed');
    }

    return this.prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
      data: {
        status: 'rejected',
      },
    });
  }

  /**
   * Generate a LiveKit token for a room participant.
   *
   * Rules:
   * - User must already be approved in room participants.
   *
   * @param roomId Target room id.
   * @param userId Authenticated user id.
   * @throws BadRequestException If user is not approved yet.
   * @returns LiveKit token payload.
   */
  async generateToken(roomId: string, userId: string) {
    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        roomId,
        userId,
        status: 'approved',
      },
    });

    if (!participant) {
      throw new BadRequestException('Not approved yet');
    }

    return this.livekitService.createToken(userId, roomId);
  }
}
