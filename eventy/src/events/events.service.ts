import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { FileUploadService } from 'src/shared/file-upload/file-upload.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { CreateEventDto } from './dto/create-event.dto';
import { GetAllEventsDto } from './dto/get-all-events.dto';
import {
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
  formatEventForRecommendation,
  getImageFieldByType,
} from './helpers/utils';

@Injectable()
export class EventsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ticketsService: TicketsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async getAllEvents(dto: GetAllEventsDto) {
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
          ownerId: user.id,
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
        include: {
          eventZones: true,
          dates: true,
        },
      });

      await this.ticketsService.generateTicketsForEventZones(
        event.eventZones,
        event.dates,
      );

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
    return this.fileUploadService.uploadTempFile(file);
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
      this.fileUploadService.ensureDirectoryExists(userDir);

      const eventDir = getEventDir(userDir, eventId);
      this.fileUploadService.ensureDirectoryExists(eventDir);

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

          this.fileUploadService.moveFile(tempFilePath, destinationFilePath);
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

      this.fileUploadService.cleanupTempDirectory();

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

  async getRecommendedEvents(user?: User) {
    const RECOMMENDED_EVENTS_LIMIT = 10;

    try {
      if (user) {
        // Future implementation for personalized recommendations based on user preferences
        // Will consider user.country, user.city, etc.
      }

      const currentDate = new Date();

      const events = await this.prismaService.event.findMany({
        take: RECOMMENDED_EVENTS_LIMIT,
        where: {
          dates: {
            some: {
              date: {
                gt: currentDate,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          categories: true,
          dates: {
            orderBy: {
              date: 'asc',
            },
          },
          eventZones: {
            orderBy: {
              price: 'asc',
            },
          },
          owner: {
            select: {
              id: true,
              userName: true,
              userSurname: true,
            },
          },
        },
      });

      return events.map((event) => formatEventForRecommendation(event));
    } catch (error) {
      console.error('Error fetching recommended events:', error);
      throw new InternalServerErrorException(
        'Failed to fetch recommended events',
      );
    }
  }
}
