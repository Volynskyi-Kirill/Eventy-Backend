import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface CreateUser {
  userName: string;
  userSurname: string;
  phoneNumber: string;
  email: string;
  pwdHash: Buffer;
}

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
  }: CreateUser) {
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
