import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

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
  }: Prisma.UserCreateInput) {
    return this.prismaService.user.create({
      data: {
        userName,
        userSurname,
        phoneNumber,
        email,
        pwdHash,
      },
    });
  }
}
