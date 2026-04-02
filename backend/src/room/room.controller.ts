import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

type AuthenticatedRequest = Request & {
  userId: string;
  user: {
    sub: string;
    email: string;
  };
};

@Controller('room')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * Creates a new room.
   */
  @Post()
  create(@Body() data: CreateRoomDto, @Req() req: AuthenticatedRequest) {
    return this.roomService.createRoom(data, req.userId);
  }

  /**
   * Returns all rooms.
   */
  @Get()
  findAll() {
    return this.roomService.findAll();
  }

  /**
   * Returns a room by id.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  /**
   * Updates a room by id.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateRoomDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomService.update(id, data, req.userId);
  }

  /**
   * Deletes a room by id.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.remove(id, req.userId);
  }
}
