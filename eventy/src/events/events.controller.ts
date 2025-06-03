import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { GetAllEventsDto } from './dto/get-all-events.dto';
import { GetOrganizerEventsDto } from './dto/get-organizer-events.dto';
import { GetOrganizerEventDetailsDto } from './dto/get-organizer-event-details.dto';
import { GetOrganizerDashboardStatsDto } from './dto/get-organizer-dashboard-stats.dto';
import { EventsService } from './events.service';

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

  @Get('organizer/dashboard-stats')
  async getOrganizerDashboardStats(
    @Query() queryParams: GetOrganizerDashboardStatsDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.getOrganizerDashboardStats(queryParams, user);
  }

  @Get('organizer')
  async getOrganizerEvents(
    @Query() queryParams: GetOrganizerEventsDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.getOrganizerEvents(queryParams, user);
  }

  @Get('organizer/:id')
  async getOrganizerEventDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryParams: GetOrganizerEventDetailsDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.getOrganizerEventDetails(id, queryParams, user);
  }

  @Public()
  @Get('recommended')
  async getRecommendedEvents(@GetUser() user?: User) {
    return this.eventsService.getRecommendedEvents(user);
  }

  //TODO REMOVE LATER
  @Public()
  @Get('')
  async getAllEvents(@Query() queryParams: GetAllEventsDto) {
    return this.eventsService.getAllEvents(queryParams);
  }

  //TODO REMOVE LATER
  @Public()
  @Get(':id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getEventById(id);
  }

  @Delete(':id')
  async deleteEvent(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    return this.eventsService.deleteEvent(id, user);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: any) {
    return this.eventsService.uploadImage(file);
  }
}
