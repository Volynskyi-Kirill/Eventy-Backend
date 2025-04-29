import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Get('event/:eventId')
  async getAvailableTickets(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('zoneId', new ParseIntPipe({ optional: true })) zoneId?: number,
  ) {
    return this.ticketsService.getAvailableTickets(eventId, zoneId);
  }

  @Post(':ticketId/purchase')
  async purchaseTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @GetUser() user: User,
  ) {
    return this.ticketsService.purchaseTicket(ticketId, user.id);
  }

  @Get('user')
  async getUserTickets(@GetUser() user: User) {
    return this.ticketsService.getUserTickets(user.id);
  }
}
