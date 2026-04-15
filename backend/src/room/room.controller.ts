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
};

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 🏠 Create room
  @Post()
  create(@Body() data: CreateRoomDto, @Req() req: AuthenticatedRequest) {
    return this.roomService.createRoom(data, req.userId);
  }

  // 📄 Get all rooms
  @Get()
  findAll() {
    return this.roomService.findAll();
  }

  // 🔍 Get room by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  // ✏️ Update room (only owner)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateRoomDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomService.update(id, data, req.userId);
  }

  // ❌ Delete room (only owner)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.remove(id, req.userId);
  }

  // 🚪 REQUEST JOIN (IMPORTANT 🔥)
  @Post(':id/join')
  requestJoin(@Param('id') roomId: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.requestJoin(roomId, req.userId);
  }

  // 👑 GET PENDING USERS (OWNER ONLY)
  @Get(':id/pending')
  getPending(@Param('id') roomId: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.getPendingUsers(roomId, req.userId);
  }

  // ✅ APPROVE USER
  @Patch(':id/approve/:userId')
  approveUser(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomService.approveUser(roomId, userId, req.userId);
  }

  // ❌ REJECT USER
  @Patch(':id/reject/:userId')
  rejectUser(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomService.rejectUser(roomId, userId, req.userId);
  }

  // 🎟️ GET LIVEKIT TOKEN (ONLY IF APPROVED)
  @Get(':id/token')
  getToken(@Param('id') roomId: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.generateToken(roomId, req.userId);
  }
}
