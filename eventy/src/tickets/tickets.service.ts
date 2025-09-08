import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventDate, EventZone, TICKET_STATUS, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';

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

  async purchaseTickets(purchaseData: PurchaseTicketDto, user: User) {
    const { ticketIds, paymentMethod, contactInfo } = purchaseData;

    const tickets = await this.prismaService.ticket.findMany({
      where: {
        id: { in: ticketIds },
      },
      include: {
        eventZone: true,
        eventDate: true,
      },
    });

    if (tickets.length !== ticketIds.length) {
      throw new NotFoundException('One or more tickets not found');
    }

    const unavailableTickets = tickets.filter(
      (ticket) => ticket.status === TICKET_STATUS.SOLD,
    );

    if (unavailableTickets.length > 0) {
      throw new ConflictException(
        `Tickets with IDs ${unavailableTickets.map((t) => t.id).join(', ')} are already sold`,
      );
    }

    try {
      return await this.prismaService.$transaction(async (prisma) => {
        let purchaseContactId: number | null = null;

        const isContactInfoDifferent =
          contactInfo.name !== user.userName ||
          contactInfo.email !== user.email ||
          contactInfo.phone !== user.phoneNumber;

        if (isContactInfoDifferent) {
          const purchaseContactInfo = await prisma.purchaseContactInfo.create({
            data: {
              name: contactInfo.name,
              email: contactInfo.email,
              phone: contactInfo.phone,
              agreeToTerms: contactInfo.agreeToTerms,
              marketingConsent: contactInfo.marketingConsent,
            },
          });
          purchaseContactId = purchaseContactInfo.id;
        }

        const isMarketingConsentDifferent =
          contactInfo.marketingConsent !== undefined &&
          contactInfo.marketingConsent !== user.marketingConsent;

        if (isMarketingConsentDifferent) {
          await prisma.user.update({
            where: { id: user.id },
            data: { marketingConsent: contactInfo.marketingConsent },
          });
        }

        const soldTickets = [];

        for (const ticketId of ticketIds) {
          const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: TICKET_STATUS.SOLD },
            include: {
              eventZone: true,
              eventDate: true,
            },
          });

          const soldTicket = await prisma.soldTicket.create({
            data: {
              ticketId: ticketId,
              buyerId: user.id,
              paymentMethod: paymentMethod,
              purchaseContactId: purchaseContactId,
            },
          });

          soldTickets.push({
            ticket: updatedTicket,
            soldTicket,
          });
        }

        return {
          purchasedTickets: soldTickets,
          totalTickets: soldTickets.length,
          paymentMethod,
          contactInfo: purchaseContactId
            ? {
                id: purchaseContactId,
                ...contactInfo,
              }
            : null,
        };
      });
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      throw new InternalServerErrorException('Failed to purchase tickets');
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
        purchaseContactInfo: true,
      },
    });
  }
}
