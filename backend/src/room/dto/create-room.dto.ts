import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { $Enums } from '@prisma/client';

export class CreateRoomDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsEnum($Enums.RoomStatus)
  status?: $Enums.RoomStatus;
}
