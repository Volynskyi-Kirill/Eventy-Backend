import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) {}

  createEvent(createEventDto: CreateEventDto) {
    // const { eventZones, socialMedia, dates, ...eventDto } = createEventDto;
    // return this.prismaService.event.create(createEventDto);
  }
}
