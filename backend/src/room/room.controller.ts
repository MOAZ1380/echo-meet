import { Controller, Get, Delete, Param } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('room')
export class RoomController {
  constructor(private readonly RoomService: RoomService) {}

  @Get()
  findAll() {
    return this.RoomService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.RoomService.remove(id);
  }
}
