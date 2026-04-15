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

@Injectable()
export class RoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly livekitService: LivekitService,
  ) {}

  // 🏠 CREATE ROOM
  async createRoom(data: CreateRoomDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const room = await this.prisma.room.create({
      data: {
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        status: data.status ?? RoomStatus.active,
        ownerId: userId,
      },
    });

    return room;
  }

  // 📄 GET ALL ROOMS
  async findAll() {
    return this.prisma.room.findMany({
      include: {
        owner: true,
        participants: true,
      },
    });
  }

  // 🔍 GET ROOM
  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
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

  // ✏️ UPDATE (OWNER ONLY)
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

  // ❌ DELETE (OWNER ONLY)
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

  // 🚪 JOIN REQUEST (PENDING)
  async requestJoin(roomId: string, userId: string) {
    const existing = await this.prisma.roomParticipant.findFirst({
      where: { roomId, userId },
    });

    if (existing) {
      throw new BadRequestException('Already requested');
    }

    return this.prisma.roomParticipant.create({
      data: {
        roomId,
        userId,
        status: 'pending',
      },
    });
  }

  // 👀 GET PENDING USERS (OWNER ONLY)
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

  // ✅ APPROVE USER
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

  // ❌ REJECT USER
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

  // 🎟️ GET LIVEKIT TOKEN (ONLY IF APPROVED)
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
