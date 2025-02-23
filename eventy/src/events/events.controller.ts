import { Controller, Post } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('')
  createEvent(createEventDto: CreateEventDto) {
    return this.eventsService.createEvent(createEventDto);
  }
}
