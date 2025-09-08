import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { FileUploadModule } from 'src/shared/file-upload/file-upload.module';

@Module({
  imports: [PrismaModule, TicketsModule, FileUploadModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
