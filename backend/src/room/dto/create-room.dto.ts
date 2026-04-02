import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsIn(['active', 'ended'])
  status?: string;
}
