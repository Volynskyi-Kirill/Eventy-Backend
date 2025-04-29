import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [PrismaModule, TicketsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
