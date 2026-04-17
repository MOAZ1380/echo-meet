import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway(8000, {
  cors: { origin: '*' },
})
/**
 * Realtime gateway for room join workflow and live meeting presence.
 */
export class MeetingGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  /**
   * Runs once after gateway initialization.
   */
  onModuleInit() {
    console.log('[Socket] Gateway ready on :8000');
  }

  /**
   * Handles a newly connected socket.
   *
   * If userId is available in handshake query, the socket joins a private
   * user room (named with userId) for targeted realtime notifications.
   *
   * @param client Current socket client.
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const participantId = client.handshake.query.participantId as string;

    if (userId) {
      client.join(userId);
    }

    if (participantId) {
      client.join(participantId);
    }
  }

  /**
   * Handles socket disconnect event.
   *
   * @param client Current socket client.
   */
  handleDisconnect(client: Socket) {
    console.log(`[Socket] Disconnected: ${client.id}`);
  }

  /**
   * Event: requestJoin
   *
   * Creates a pending join request, then notifies room owner in realtime.
   * Emits room:join-request to the owner private room.
   *
   * @param data Room id and requester user id.
   * @returns Success flag.
   */
  @SubscribeMessage('requestJoin')
  async requestJoin(
    @MessageBody()
    data: {
      roomId: string;
      name: string;
      participantId: string;
    },
  ) {
    console.log('🔥 requestJoin called', data);
    const participant = await this.roomService.requestJoin(
      data.roomId,
      data.name,
      data.participantId,
    );

    const room = await this.roomService.findOne(data.roomId);

    // return id if user is guest (no userId), otherwise return userId
    this.server.to(room.ownerId).emit('room:join-request', {
      roomId: data.roomId,
      participantId: data.participantId,
      participant,
    });

    return { success: true };
  }

  /**
   * Event: approveUser
   *
   * Approves a join request and notifies the approved user.
   * Emits room:approved to the approved user's private room.
   *
   * @param data Room id, target user id, and owner id.
   * @returns Success flag.
   */
  @SubscribeMessage('approveUser')
  async approveUser(
    @MessageBody()
    data: {
      roomId: string;
      participantId: string;
      ownerId: string;
    },
  ) {
    console.log('🔥 approveUser called', data);
    await this.roomService.approveUser(
      data.roomId,
      data.participantId,
      data.ownerId,
    );

    this.server.to(data.participantId).emit('room:approved', {
      roomId: data.roomId,
      participantId: data.participantId,
    });

    this.server.to(data.ownerId).emit('room:approved', {
      roomId: data.roomId,
      participantId: data.participantId,
    });

    return { success: true };
  }

  /**
   * Event: rejectUser
   *
   * Rejects a join request and notifies the rejected user.
   * Emits room:rejected to the rejected user's private room.
   *
   * @param data Room id, target user id, and owner id.
   * @returns Success flag.
   */
  @SubscribeMessage('rejectUser')
  async rejectUser(
    @MessageBody()
    data: {
      roomId: string;
      participantId: string;
      ownerId: string;
    },
  ) {
    console.log('🔥 rejectUser called', data);
    await this.roomService.rejectUser(
      data.roomId,
      data.participantId,
      data.ownerId,
    );

    this.server.to(data.participantId).emit('room:rejected', {
      roomId: data.roomId,
      participantId: data.participantId,
      reason: 'غير مسموح لك بالانضمام إلى هذه الغرفة.',
    });

    return { success: true };
  }

  /**
   * Event: joinRoom
   *
   * Adds socket to room channel and announces presence to room members.
   * Emits userJoined to the room after successful join.
   *
   * @param data Room id and joining user id.
   * @param client Current socket client.
   * @returns Success flag or error event emission when room is missing.
   */
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() data: { roomId: string; participantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomService.findOne(data.roomId);

    if (!room) {
      return client.emit('error', { message: 'Room not found' });
    }

    const participant = await this.roomService[
      'prisma'
    ].roomParticipant.findFirst({
      where: {
        roomId: room.id,
        id: data.participantId,
        status: 'approved',
      },
    });

    if (!participant) {
      return client.emit('error', { message: 'Not approved yet' });
    }

    client.join(room.id);

    this.server.to(room.id).emit('userJoined', {
      participantId: data.participantId,
    });

    return { success: true };
  }
}
