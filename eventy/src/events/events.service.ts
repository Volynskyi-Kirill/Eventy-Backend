import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { User, TICKET_STATUS } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUploadService } from 'src/shared/file-upload/file-upload.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { CreateEventDto } from './dto/create-event.dto';
import { GetAllEventsDto } from './dto/get-all-events.dto';
import { GetOrganizerEventDetailsDto } from './dto/get-organizer-event-details.dto';
import {
  EventStatus,
  GetOrganizerEventsDto,
} from './dto/get-organizer-events.dto';
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
  transformOrganizerEventDetails,
  type OrganizerEventDetails,
  type OrganizerEventDetailsData,
} from './helpers/organizer-event-details-utils';
import {
  transformOrganizerEventData,
  type GroupedOrganizerEvents,
  type OrganizerEventData,
} from './helpers/organizer-utils';
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

  async getOrganizerEvents(
    dto: GetOrganizerEventsDto,
    user: User,
  ): Promise<GroupedOrganizerEvents> {
    try {
      const events = await this.prismaService.event.findMany({
        where: {
          ownerId: user.id,
        },

        include: {
          dates: true,
          eventZones: {
            include: {
              tickets: {
                include: {
                  eventDate: true,
                },
              },
            },
          },
          categories: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const groupedEvents = transformOrganizerEventData(
        events as OrganizerEventData[],
      );

      // Filter by status if specified
      switch (dto.status) {
        case EventStatus.UPCOMING:
          return { upcoming: groupedEvents.upcoming, past: [] };
        case EventStatus.PAST:
          return { upcoming: [], past: groupedEvents.past };
        default:
          return groupedEvents;
      }
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      throw new InternalServerErrorException(
        'Failed to fetch organizer events',
      );
    }
  }

  async getOrganizerEventDetails(
    eventId: number,
    dto: GetOrganizerEventDetailsDto,
    user: User,
  ): Promise<OrganizerEventDetails> {
    try {
      const event = await this.prismaService.event.findFirst({
        where: {
          id: eventId,
          ownerId: user.id,
        },
        include: {
          dates: true,
          eventZones: {
            include: {
              tickets: {
                include: {
                  eventDate: true,
                  soldTicket: {
                    include: {
                      buyer: true,
                      purchaseContactInfo: true,
                    },
                  },
                },
              },
            },
          },
          categories: true,
          speakers: true,
          owner: true,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found or access denied');
      }

      return transformOrganizerEventDetails(
        event as OrganizerEventDetailsData,
        dto.selectedDate,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching organizer event details:', error);
      throw new InternalServerErrorException('Failed to fetch event details');
    }
  }

  async deleteEvent(eventId: number, user: User) {
    try {
      // Проверяем, существует ли событие и принадлежит ли оно пользователю
      const event = await this.prismaService.event.findFirst({
        where: {
          id: eventId,
          ownerId: user.id,
        },
        include: {
          eventZones: {
            include: {
              tickets: true,
            },
          },
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found or access denied');
      }

      // Проверяем, есть ли купленные билеты
      const hasSoldTickets = event.eventZones.some((zone) =>
        zone.tickets.some(
          (ticket) => ticket.status !== TICKET_STATUS.AVAILABLE,
        ),
      );

      if (hasSoldTickets) {
        throw new BadRequestException(
          'Cannot delete event with sold tickets. Event has purchased tickets.',
        );
      }

      // Удаляем все связанные сущности в транзакции
      await this.prismaService.$transaction(async (prisma) => {
        // Удаляем билеты
        await prisma.ticket.deleteMany({
          where: {
            eventZone: {
              eventId: eventId,
            },
          },
        });

        // Удаляем зоны событий
        await prisma.eventZone.deleteMany({
          where: {
            eventId: eventId,
          },
        });

        // Удаляем даты событий
        await prisma.eventDate.deleteMany({
          where: {
            eventId: eventId,
          },
        });

        // Удаляем социальные медиа
        await prisma.eventSocialMedia.deleteMany({
          where: {
            eventId: eventId,
          },
        });

        // Удаляем само событие (categories связаны через many-to-many, поэтому автоматически отвяжутся)
        await prisma.event.delete({
          where: {
            id: eventId,
          },
        });
      });

      await this.deleteEventImages(eventId, user);

      return {
        success: true,
        message: 'Event successfully deleted',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error deleting event:', error);
      throw new InternalServerErrorException('Failed to delete event');
    }
  }

  private async deleteEventImages(eventId: number, user: User) {
    try {
      const userDir = getUserDir(user.id, user.userName);
      const eventDir = getEventDir(userDir, eventId);
  
      if (fs.existsSync(eventDir)) {
        fs.rmSync(eventDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error deleting event images:', error);
    }
  }
}
