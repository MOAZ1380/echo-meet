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

// change port for 8000
@WebSocketGateway(8000)
export class ChatGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  onModuleInit() {
    console.log('ChatGateway initialized');
  }

  // when disconnected
  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
  }

  // 1️⃣ إنشء غرفة جديدة
  @SubscribeMessage('createRoom')
  async createRoom(@ConnectedSocket() client: Socket) {
    const room = await this.roomService.createRoom(); // Prisma يحفظها
    client.join(room.id);
    console.log(`Client ${client.id} created and joined room ${room.id}`);
    return { event: 'roomCreated', roomId: room.id };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Client ${client.id} is trying to join room ${data.roomId}`);
    const room = await this.roomService.findOne(data.roomId);
    if (!room) return { event: 'error', message: 'Room not found' };

    client.join(room.id);
    this.server.to(room.id).emit('userJoined', { userId: client.id });
    return { event: 'joinedRoom', roomId: room.id };
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} sent message to room ${data.roomId}: ${data.message}`,
    );
    this.server
      .to(data.roomId)
      .emit('newMessage', { userId: client.id, message: data.message });
  }
}
