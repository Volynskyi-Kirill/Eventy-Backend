import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventDate, EventZone, TICKET_STATUS } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateTicketsForEventZones(
    eventZones: EventZone[],
    eventDates: EventDate[],
  ) {
    for (const eventZone of eventZones) {
      const { id: eventZoneId, seatCount } = eventZone;

      for (const eventDate of eventDates) {
        const { id: eventDateId } = eventDate;

        const ticketsData = Array.from(
          { length: seatCount },
          (_, seatIndex) => ({
            eventZoneId,
            eventDateId,
            seatNumber: seatIndex + 1,
            status: TICKET_STATUS.AVAILABLE,
          }),
        );

        try {
          await this.prismaService.ticket.createMany({
            data: ticketsData,
          });
        } catch (error) {
          console.error(
            `Error generating tickets for event zone ${eventZoneId} and date ${eventDateId}:`,
            error,
          );
          throw new InternalServerErrorException(
            'Failed to generate tickets for event zone and date',
          );
        }
      }
    }
  }

  async getAvailableTickets(
    eventId: number,
    eventZoneId?: number,
    eventDateId?: number,
  ) {
    const where = {
      eventZone: {
        eventId: eventId,
        ...(eventZoneId && { id: eventZoneId }),
      },
      ...(eventDateId && { eventDateId }),
      status: TICKET_STATUS.AVAILABLE,
    };

    return this.prismaService.ticket.findMany({
      where,
      include: {
        eventZone: true,
        eventDate: true,
      },
    });
  }

  async purchaseTicket(ticketId: number, userId: number) {
    const ticket = await this.prismaService.ticket.findUnique({
      where: { id: ticketId },
      include: {
        eventZone: true,
        eventDate: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === TICKET_STATUS.SOLD) {
      throw new ConflictException('Ticket is already sold');
    }

    try {
      return await this.prismaService.$transaction(async (prisma) => {
        // Update ticket status
        const updatedTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TICKET_STATUS.SOLD },
          include: {
            eventZone: true,
            eventDate: true,
          },
        });

        // Create sold ticket record
        const soldTicket = await prisma.soldTicket.create({
          data: {
            ticketId: ticketId,
            buyerId: userId,
          },
        });

        return {
          ticket: updatedTicket,
          soldTicket,
        };
      });
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      throw new InternalServerErrorException('Failed to purchase ticket');
    }
  }

  async getUserTickets(userId: number) {
    return this.prismaService.soldTicket.findMany({
      where: { buyerId: userId },
      include: {
        ticket: {
          include: {
            eventZone: {
              include: {
                event: true,
              },
            },
            eventDate: true,
          },
        },
      },
    });
  }
}
