import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';
import { MeetingService } from './meeting.service';

@WebSocketGateway(8000, {
  cors: { origin: '*' },
})
/**
 * Realtime gateway for room join workflow and live meeting presence.
 */
export class MeetingGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly meetingService: MeetingService) {}

  /**
   * Runs once after gateway initialization.
   */
  onModuleInit() {}

  /**
   * Handles a newly connected socket.
   *
   * If userId is available in handshake query, the socket joins a private
   * user room (named with userId) for targeted realtime notifications.
   *
   * @param client Current socket client.
   */
  handleConnection(client: Socket) {
    const { userId, participantId } =
      this.meetingService.resolvePrivateChannelIds(
        client.handshake.query as Record<string, unknown>,
      );

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
  handleDisconnect(client: Socket) {}

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
    const requestData = await this.meetingService.requestJoin(data);

    // return id if user is guest (no userId), otherwise return userId
    this.server.to(requestData.ownerId).emit('room:join-request', {
      roomId: requestData.roomId,
      participantId: requestData.participantId,
      participant: requestData.participant,
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
    const approvedData = await this.meetingService.approveUser(data);

    this.server.to(approvedData.participantId).emit('room:approved', {
      roomId: approvedData.roomId,
      participantId: approvedData.participantId,
    });

    this.server.to(approvedData.ownerId).emit('room:approved', {
      roomId: approvedData.roomId,
      participantId: approvedData.participantId,
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
    const rejectedData = await this.meetingService.rejectUser(data);

    this.server.to(rejectedData.participantId).emit('room:rejected', {
      roomId: rejectedData.roomId,
      participantId: rejectedData.participantId,
      reason: 'Your request to join the room was rejected by the owner.',
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
    let joinData: { roomId: string; participantId: string } | null = null;

    try {
      joinData = await this.meetingService.validateJoinRoom(
        data.roomId,
        data.participantId,
      );
    } catch {
      return client.emit('error', { message: 'Room not found' });
    }

    if (!joinData) {
      return client.emit('error', { message: 'Not approved yet' });
    }

    client.join(joinData.roomId);

    this.server.to(joinData.roomId).emit('userJoined', {
      participantId: joinData.participantId,
    });

    return { success: true };
  }
}
