import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createEvent(createEventDto: CreateEventDto) {
    const {
      dates,
      eventZones,
      socialMedia,
      categoryIds,
      speakerIds,
      ...eventData
    } = createEventDto;

    return await this.prismaService.event.create({
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
  }
}
