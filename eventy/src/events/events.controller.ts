import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('')
  createEvent(@Body() createEventDto: CreateEventDto) {
    console.log("🚀 ~ EventsController ~ createEvent ~ createEventDto:", createEventDto)
    return this.eventsService.createEvent(createEventDto);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: any, @GetUser() user: User) {
    return this.eventsService.uploadImage(file, user);
  }
}
