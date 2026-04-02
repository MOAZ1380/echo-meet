import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Creates a user through the user service.
   */
  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  /**
   * Returns the full list of users.
   */
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  /**
   * Returns a single user by id.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  /**
   * Updates a user by id.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.userService.update(id, data);
  }

  /**
   * Deletes a user by id.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
