import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a room using defaults when a field is omitted.
   */
  async createRoom(data: CreateRoomDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const startTime = data.startTime ? new Date(data.startTime) : new Date();

    const room = await this.prisma.room.create({
      data: {
        startTime,
        status: data.status ?? 'active',
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return room;
  }

  /**
   * Returns all rooms.
   */
  async findAll() {
    return this.prisma.room.findMany({
      include: { user: true },
    });
  }

  /**
   * Returns a single room by id.
   */
  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { user: true },
    });

    return room;
  }

  /**
   * Updates a room after validating the request body and record existence.
   */
  async update(id: string, data: UpdateRoomDto, userId: string) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    const room = await this.prisma.room.findFirst({
      where: { id, userId },
    });

    if (!room) {
      throw new NotFoundException('Room not found for this user');
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
      },
    });

    return updatedRoom;
  }

  /**
   * Deletes a room after verifying it exists.
   */
  async remove(id: string, userId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, userId },
    });

    if (!room) {
      throw new NotFoundException('Room not found for this user');
    }

    return this.prisma.room.delete({
      where: { id },
    });
  }
}
