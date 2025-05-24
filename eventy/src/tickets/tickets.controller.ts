import {
  Body,
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
import { OptionalParseIntPipe } from 'src/shared/pipes';
import { PurchaseTicketDto } from './dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Get('event/:eventId')
  async getAvailableTickets(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('zoneId', OptionalParseIntPipe) zoneId?: number,
  ) {
    return this.ticketsService.getAvailableTickets(eventId, zoneId);
  }

  @Post('purchase')
  async purchaseTickets(
    @Body() purchaseTicketData: PurchaseTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.purchaseTickets(purchaseTicketData, user);
  }

  @Get('user')
  async getUserTickets(@GetUser() user: User) {
    return this.ticketsService.getUserTickets(user.id);
  }
}
