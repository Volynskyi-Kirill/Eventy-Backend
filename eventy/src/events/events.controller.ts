import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';
import { GetAllEventsDto } from './dto/get-all-events.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('')
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @GetUser() user: User,
  ) {
    const event = await this.eventsService.createEvent(createEventDto, user);

    return event;
  }

  @Get('')
  async getAllEvents(@Query() queryParams: GetAllEventsDto) {
    return this.eventsService.getAllEvents(queryParams);
  }

  @Get(':id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getEventById(id);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: any) {
    return this.eventsService.uploadImage(file);
  }
}
