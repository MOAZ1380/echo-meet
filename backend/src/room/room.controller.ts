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

/**
 * Room HTTP endpoints.
 *
 * All routes in this controller are protected by `JwtAuthGuard`.
 * The authenticated user id is expected on `req.userId`.
 */
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * Create a new room owned by the authenticated user.
   *
   * @param data Room creation payload.
   * @param req Authenticated request containing `userId`.
   * @returns Newly created room record.
   */
  @Post()
  create(@Body() data: CreateRoomDto, @Req() req: AuthenticatedRequest) {
    return this.roomService.createRoom(data, req.userId);
  }

  /**
   * List all rooms.
   *
   * Includes owner and participants in the response.
   * @returns Array of rooms.
   */
  @Get()
  findAll() {
    return this.roomService.findAll();
  }

  /**
   * Get one room by id.
   *
   * @param id Room id.
   * @returns Room with owner and participants.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  /**
   * Update room data.
   *
   * Only the room owner can update.
   * @param id Room id.
   * @param data Partial room update payload.
   * @param req Authenticated request containing `userId`.
   * @returns Updated room.
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
   * Delete a room.
   *
   * Only the room owner can delete.
   * @param id Room id.
   * @param req Authenticated request containing `userId`.
   * @returns Deleted room record.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.remove(id, req.userId);
  }

  /**
   * Request to join a room.
   *
   * Creates a participant record with pending status.
   * @param roomId Target room id.
   * @param req Authenticated request containing `userId`.
   * @returns Newly created pending participant record.
   */
  @Post(':id/join')
  requestJoin(
    @Param('id') roomId: string,
    @Body('name') name: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomService.requestJoin(roomId, name || 'Guest', req.userId);
  }

  /**
   *
   * @param roomId
   * @param name
   * @returns
   */
  @Post(':id/guest-join')
  guestJoin(@Param('id') roomId: string, @Body('name') name: string) {
    return this.roomService.requestJoin(roomId, name);
  }

  /**
   * Get users with pending join requests for a room.
   *
   * Owner only.
   * @param roomId Target room id.
   * @param req Authenticated request containing `userId`.
   * @returns List of pending participants including user details.
   */
  @Get(':id/pending')
  getPending(@Param('id') roomId: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.getPendingUsers(roomId, req.userId);
  }

  /**
   * Approve a user's join request.
   *
   * Owner only.
   * @param roomId Target room id.
   * @param userId User id to approve.
   * @param req Authenticated request containing `userId`.
   * @returns Updated participant record with approved status.
   */
  @Patch(':id/approve/:userId')
  approveUser(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomService.approveUser(roomId, userId, req.userId);
  }

  /**
   * Reject a user's join request.
   *
   * Owner only.
   * @param roomId Target room id.
   * @param userId User id to reject.
   * @param req Authenticated request containing `userId`.
   * @returns Updated participant record with rejected status.
   */
  @Patch(':id/reject/:userId')
  rejectUser(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomService.rejectUser(roomId, userId, req.userId);
  }

  /**
   * Generate a LiveKit token for a room participant.
   *
   * Token is issued only if the requester was approved for the room.
   * @param roomId Target room id.
   * @param req Authenticated request containing `userId`.
   * @returns LiveKit access token payload.
   */
  @Get(':id/token')
  getToken(@Param('id') roomId: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.generateToken(roomId, req.userId);
  }
}
