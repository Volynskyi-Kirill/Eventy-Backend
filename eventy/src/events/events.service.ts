import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateEventDto } from './dto/create-event.dto';
import { GetAllEventsDto } from './dto/get-all-events.dto';
import {
  FILE_CLEANUP,
  TEMP_UPLOADS_DIR,
  TEMP_UPLOADS_URL_PREFIX,
  getEventDir,
  getEventImageUrlPath,
  getUserDir,
} from './helpers/constants';
import {
  buildEventWhereClause,
  buildPaginationMetadata,
  calculateSkip,
  createOrderByObject,
  transformEventData,
} from './helpers/filter-utils';
import {
  createTypedFilename,
  determineImageType,
  getImageFieldByType,
} from './helpers/utils';

@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllEvents(dto: GetAllEventsDto) {
    console.log('🚀 ~ EventsService ~ getAllEvents ~ dto:', dto);
    const where = buildEventWhereClause(dto);
    const skip = calculateSkip(dto.page, dto.limit);
    const orderBy = createOrderByObject(dto.sortBy, dto.sortDirection);

    const totalEvents = await this.prismaService.event.count({ where });

    let events;
    try {
      events = await this.prismaService.event.findMany({
        skip,
        take: dto.limit,
        where,
        orderBy,
        include: {
          categories: true,
          dates: true,
          eventZones: true,
        },
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new InternalServerErrorException();
    }

    const transformedEvents = transformEventData(events);

    return {
      events: transformedEvents,
      pagination: buildPaginationMetadata(totalEvents, dto.page, dto.limit),
    };
  }

  async getEventById(id: number) {
    return this.prismaService.event.findUniqueOrThrow({
      where: { id },
      include: {
        dates: true,
        eventZones: true,
        socialMedia: true,
        categories: true,
        speakers: true,
        owner: {
          select: {
            id: true,
            userName: true,
            userSurname: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async createEvent(createEventDto: CreateEventDto, user: User) {
    try {
      const {
        dates,
        eventZones,
        socialMedia,
        categoryIds,
        speakerIds,
        coverImg,
        logoImg,
        mainImg,
        ...eventData
      } = createEventDto;

      const event = await this.prismaService.event.create({
        data: {
          ...eventData,
          dates: {
            create: dates.map((dateDto) => ({
              date: new Date(dateDto.date),
            })),
          },

          eventZones: {
            create: eventZones,
          },

          socialMedia: {
            create: socialMedia,
          },

          ...(categoryIds && {
            categories: {
              connect: categoryIds.map((id) => ({ id })),
            },
          }),

          ...(speakerIds && {
            speakers: {
              connect: speakerIds.map((id) => ({ id })),
            },
          }),
        },
      });

      const imagePaths = [coverImg, logoImg, mainImg].filter(
        Boolean,
      ) as string[];

      const isImageUploaded = imagePaths.length > 0;
      if (isImageUploaded) {
        await this.moveEventImages(imagePaths, event.id, user, createEventDto);
      }

      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async uploadImage(file: any) {
    const isTempDirExists = fs.existsSync(TEMP_UPLOADS_DIR);
    if (!isTempDirExists) {
      fs.mkdirSync(TEMP_UPLOADS_DIR, { recursive: true });
    }

    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(TEMP_UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    return {
      filePath: `${TEMP_UPLOADS_URL_PREFIX}/${uniqueFilename}`,
    };
  }

  async moveEventImages(
    imagePaths: string[],
    eventId: number,
    user: User,
    createEventDto: CreateEventDto,
  ) {
    try {
      const { coverImg, logoImg, mainImg } = createEventDto;

      const userDir = getUserDir(user.id, user.userName);

      const isUserDirExists = fs.existsSync(userDir);
      if (!isUserDirExists) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const eventDir = getEventDir(userDir, eventId);

      const isEventDirExists = fs.existsSync(eventDir);
      if (!isEventDirExists) {
        fs.mkdirSync(eventDir, { recursive: true });
      }

      const updatedImagePaths: Record<string, string> = {};
      const movedFiles: string[] = [];

      for (const imagePath of imagePaths) {
        const filename = path.basename(imagePath);
        const tempFilePath = path.join(process.cwd(), imagePath.slice(1));

        if (fs.existsSync(tempFilePath)) {
          const imageType = determineImageType(
            imagePath,
            coverImg,
            logoImg,
            mainImg,
          );

          if (!imageType) {
            continue;
          }

          const newFilename = createTypedFilename(filename, imageType);
          const destinationFilePath = path.join(eventDir, newFilename);

          fs.copyFileSync(tempFilePath, destinationFilePath);
          movedFiles.push(tempFilePath);

          const newPath = getEventImageUrlPath(
            user.id,
            user.userName,
            eventId,
            newFilename,
          );

          const fieldName = getImageFieldByType(imageType);
          updatedImagePaths[fieldName] = newPath;
        }
      }

      const isUpdatedImagePaths = Object.keys(updatedImagePaths).length > 0;
      if (isUpdatedImagePaths) {
        await this.updateEventImagePaths(eventId, updatedImagePaths);
      }

      for (const file of movedFiles) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }

      this.cleanupTempDirectory();

      return { success: true };
    } catch (error) {
      console.error('Error moving event images:', error);
      throw error;
    }
  }

  async updateEventImagePaths(
    eventId: number,
    imagePaths: Record<string, string>,
  ) {
    return this.prismaService.event.update({
      where: { id: eventId },
      data: imagePaths,
    });
  }

  async cleanupTempDirectory() {
    if (!fs.existsSync(TEMP_UPLOADS_DIR)) return;

    const files = fs.readdirSync(TEMP_UPLOADS_DIR);
    const now = Date.now();

    const TIME_TO_DELETE_FILE = FILE_CLEANUP.TEN_SECONDS;

    for (const file of files) {
      const filePath = path.join(TEMP_UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);

      const isOld = now - stats.mtimeMs > TIME_TO_DELETE_FILE;
      if (isOld) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
