import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventZone, TICKET_STATUS } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateTicketsForEventZones(eventZones: EventZone[]) {
    try {
      for (const zone of eventZones) {
        const ticketsToCreate = Array.from(
          { length: zone.seatCount },
          (_, index) => ({
            eventZoneId: zone.id,
            seatNumber: index + 1, // Start from seat number 1
            status: TICKET_STATUS.AVAILABLE,
          }),
        );

        await this.prismaService.ticket.createMany({
          data: ticketsToCreate,
        });
      }
    } catch (error) {
      console.error('Error generating tickets for event zones:', error);
      throw new InternalServerErrorException('Failed to generate tickets');
    }
  }

  async getAvailableTickets(eventId: number, eventZoneId?: number) {
    const where = eventZoneId
      ? {
          eventZone: {
            id: eventZoneId,
            eventId: eventId,
          },
          status: TICKET_STATUS.AVAILABLE,
        }
      : {
          eventZone: {
            eventId: eventId,
          },
          status: TICKET_STATUS.AVAILABLE,
        };

    return this.prismaService.ticket.findMany({
      where,
      include: {
        eventZone: true,
      },
    });
  }

  async purchaseTicket(ticketId: number, userId: number) {
    const ticket = await this.prismaService.ticket.findUnique({
      where: { id: ticketId },
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
          },
        },
      },
    });
  }
}
