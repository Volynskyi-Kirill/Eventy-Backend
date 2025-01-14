import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  findById(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        userName: true,
        userSurname: true,
        phoneNumber: true,
        email: true,
      },
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
}
