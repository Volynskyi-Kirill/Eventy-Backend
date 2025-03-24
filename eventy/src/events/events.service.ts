import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@prisma/client';
@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createEvent(createEventDto: CreateEventDto) {
    try {
      const {
        dates,
        eventZones,
        socialMedia,
        categoryIds,
        speakerIds,
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

      console.log('🚀 ~ EventsService ~ createEvent ~ event:', event);

      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  //TODO если юзер не создал евент, удалять загруженные изображения
  //TODO привязывать изображения к евенту (хранить в папке с айдишником евета?)
  async uploadImage(file: any, user: User) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const userDir = path.join(uploadsDir, `${user.id}-${user.userName}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(userDir, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    return {
      filePath: `/uploads/${user.id}-${user.userName}/${uniqueFilename}`,
    };
  }
}
