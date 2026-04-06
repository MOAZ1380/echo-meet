import { OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';

@WebSocketGateway(8000, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  onModuleInit() {
    console.log('[Socket] Gateway ready on :8000');
  }

  handleDisconnect(client: Socket) {
    console.log(`[Socket] Disconnected: ${client.id}`);
  }

  /**
   * Event: createRoom (client -> server)
   * Emits: roomCreated (server -> client)
   */
  @SubscribeMessage('createRoom')
  async createRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomService.createRoom({}, data.userId);

    client.join(room.id);

    console.log(`[Room] Created ${room.id} by ${client.id}`);

    client.emit('roomCreated', { roomId: room.id });
  }

  /**
   * Event: joinRoom (client -> server)
   * Emits: joinedRoom (server -> client), userJoined (server -> room)
   */
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomService.findOne(data.roomId);

    if (!room) {
      return client.emit('error', { message: 'Room not found' });
    }

    client.join(room.id);

    console.log(`[Room] ${client.id} joined ${room.id}`);

    client.emit('joinedRoom', { roomId: room.id });

    this.server.to(room.id).emit('userJoined', {
      userId: client.id,
    });
  }

  /**
   * Event: sendMessage (client -> server)
   * Emits: newMessage (server -> room)
   */
  @SubscribeMessage('sendMessage')
  sendMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.roomId).emit('newMessage', {
      userId: client.id,
      message: data.message,
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody()
    data: { roomId: string; offer: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('offer', {
      offer: data.offer,
      from: client.id,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody()
    data: { answer: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('answer', {
      answer: data.answer,
      from: client.id,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody()
    data: { candidate: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: client.id,
    });
  }
}
