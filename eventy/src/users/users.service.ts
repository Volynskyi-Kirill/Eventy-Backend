import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { ERROR_MESSAGES, SALT_ROUNDS } from 'src/shared/constants';
import { FileUploadService } from 'src/shared/file-upload/file-upload.service';
import {
  getUserDir,
  getUserPersonalDir,
  getUserAvatarPath,
} from 'src/events/helpers/constants';

@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    private fileUploadService: FileUploadService,
  ) {}

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

  async uploadAvatar(file: any, user: User) {
    try {
      // Upload file to temp directory
      const { filePath: tempPath, filename } =
        await this.fileUploadService.uploadTempFile(file);

      // Create user directories if they don't exist
      const userDir = getUserDir(user.id, user.userName);
      this.fileUploadService.ensureDirectoryExists(userDir);

      const personalDir = getUserPersonalDir(userDir);
      this.fileUploadService.ensureDirectoryExists(personalDir);

      // Define avatar filename and paths
      const avatarFilename = `avatar${path.extname(filename)}`;
      const avatarDestPath = path.join(personalDir, avatarFilename);
      const tempFilePath = path.join(process.cwd(), tempPath.slice(1));

      // Move file from temp to user's personal directory
      this.fileUploadService.moveFile(tempFilePath, avatarDestPath);

      // Create URL path for avatar
      const avatarUrl = getUserAvatarPath(
        user.id,
        user.userName,
        avatarFilename,
      );

      // Update user record with avatar URL
      await this.update(user.id, { avatarUrl });

      // Clean up temp directory
      this.fileUploadService.cleanupTempDirectory();

      return { avatarUrl };
    } catch (error) {
      console.error('Error uploading user avatar:', error);
      throw error;
    }
  }
}
