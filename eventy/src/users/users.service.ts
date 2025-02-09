import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ERROR_MESSAGES, SALT_ROUNDS } from 'src/shared/constants';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async findById(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create({
    userName,
    userSurname,
    phoneNumber,
    email,
    pwdHash,
    provider,
    providerId,
    avatarUrl,
  }: Prisma.UserCreateInput) {
    return this.prismaService.user.create({
      data: {
        userName,
        userSurname,
        phoneNumber,
        email,
        pwdHash,
        provider,
        providerId,
        avatarUrl,
      },
    });
  }

  async update(
    id: number,
    data: Prisma.UserUpdateInput & {
      password?: string;
      newPassword?: string;
    },
  ) {
    const { password, newPassword, ...updateData } = data;

    if (password && newPassword) {
      await this.updatePassword(id, password, newPassword);
    }

    return this.prismaService.user.update({
      where: { id },
      data: updateData,
    });
  }

  private async updatePassword(
    id: number,
    password: string,
    newPassword: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user || !user.pwdHash) {
      throw new BadRequestException(
        ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_NOT_SET,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.pwdHash);

    if (!isPasswordValid) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_OLD_PASSWORD);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prismaService.user.update({
      where: { id },
      data: { pwdHash: hashedNewPassword },
    });
  }
}
