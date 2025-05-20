import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  NotFoundException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(
    @GetUser() user: Omit<User, 'pwdHash'> & { isHavePassword: boolean },
  ) {
    return user;
  }

  @Get('by-email')
  async getUserByEmail(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      userName: user.userName,
      userSurname: user.userSurname,
      email: user.email,
    };
  }

  @Patch('')
  async updateUser(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@UploadedFile() file: any, @GetUser() user: User) {
    return this.usersService.uploadAvatar(file, user);
  }
}
