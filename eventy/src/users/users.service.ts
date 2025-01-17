import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS, ERROR_MESSAGES } from 'src/shared/constants';

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
      oldPassword?: string;
      newPassword?: string;
    },
  ) {
    const isPasswordUpdate = data.oldPassword && data.newPassword;

    if (isPasswordUpdate) {
      data.pwdHash = await this.updatePassword(
        id,
        data.oldPassword as string,
        data.newPassword as string,
      );
      delete data.oldPassword;
      delete data.newPassword;
    }

    return this.prismaService.user.update({
      where: { id },
      data,
    });
  }

  private async updatePassword(
    id: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user || !user.pwdHash) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_NOT_SET);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.pwdHash);

    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.INVALID_OLD_PASSWORD);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    return hashedNewPassword;
  }
}
