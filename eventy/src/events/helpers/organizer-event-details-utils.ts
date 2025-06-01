import {
  Event,
  EventDate,
  EventZone,
  Category,
  Ticket,
  SoldTicket,
  User,
  PurchaseContactInfo,
  TICKET_STATUS,
} from '@prisma/client';

export interface OrganizerEventDetailsData extends Event {
  dates: EventDate[];
  eventZones: (EventZone & {
    tickets: (Ticket & {
      eventDate: EventDate;
      soldTicket?: SoldTicket & {
        buyer: User;
        purchaseContactInfo?: PurchaseContactInfo;
      };
    })[];
  })[];
  categories: Category[];
  speakers: User[];
  owner: User;
}

export interface EventDateTimeSlot {
  date: string;
  time: string;
  dateObj: Date;
  eventDateId: number;
}

export interface EventBooking {
  id: number;
  ticketId: number;
  seatNumber: number;
  zoneName: string;
  price: number;
  currency: string;
  paymentMethod: string;
  purchaseDate: string;
  eventDate: string;
  eventTime: string;
  buyerName: string;
  buyerEmail: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface EventStatistics {
  totalTickets: number;
  soldTickets: number;
  availableTickets: number;
  totalRevenue: number;
  currency: string;
  guestsCount: number;
  totalSeats: number;
}

export interface OrganizerEventDetails {
  id: number;
  title: string;
  coverImg: string;
  logoImg: string;
  mainImg: string;
  categories: { id: number; name: string }[];
  location: {
    country: string;
    state: string;
    city: string;
    street: string;
    buildingNumber: string;
  };
  price: {
    min: number;
    max: number;
    currency: string;
  };
  shortDescription: string;
  fullDescription: string;
  speakers: {
    id: number;
    userName: string;
    userSurname: string;
    email: string;
    avatarUrl: string;
  }[];
  owner: {
    id: number;
    userName: string;
    userSurname: string;
    email: string;
  };
  availableDates: EventDateTimeSlot[];
  statistics: EventStatistics;
  bookings: EventBooking[];
  selectedDate?: string;
}

export function transformOrganizerEventDetails(
  event: OrganizerEventDetailsData,
  selectedDate?: string,
): OrganizerEventDetails {
  // Calculate price range
  const prices = event.eventZones.map((zone) => zone.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currency = event.eventZones[0]?.currency || 'UAH';

  // Transform available dates
  const availableDates = event.dates
    .map((date) => ({
      date: date.date.toISOString().split('T')[0],
      time: date.date.toTimeString().slice(0, 5),
      dateObj: date.date,
      eventDateId: date.id,
    }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Filter tickets by selected date if provided
  const filteredTickets = selectedDate
    ? event.eventZones.flatMap((zone) =>
        zone.tickets.filter(
          (ticket) =>
            ticket.eventDate.date.toISOString().split('T')[0] === selectedDate,
        ),
      )
    : event.eventZones.flatMap((zone) => zone.tickets);

  // Calculate statistics
  const totalTickets = filteredTickets.length;
  const soldTickets = filteredTickets.filter(
    (ticket) => ticket.status === TICKET_STATUS.SOLD,
  ).length;
  const availableTickets = filteredTickets.filter(
    (ticket) => ticket.status === TICKET_STATUS.AVAILABLE,
  ).length;

  const totalRevenue = filteredTickets
    .filter((ticket) => ticket.soldTicket)
    .reduce((sum, ticket) => {
      const zone = event.eventZones.find((z) => z.id === ticket.eventZoneId);
      return sum + (zone?.price || 0);
    }, 0);

  const guestsCount = soldTickets;
  const totalSeats = selectedDate
    ? event.eventZones.reduce((total, zone) => {
        const zoneTicketsForDate = zone.tickets.filter(
          (ticket) =>
            ticket.eventDate.date.toISOString().split('T')[0] === selectedDate,
        );
        return total + zoneTicketsForDate.length;
      }, 0)
    : event.eventZones.reduce((total, zone) => total + zone.seatCount, 0);

  // Transform bookings
  const bookings: EventBooking[] = filteredTickets
    .filter((ticket) => ticket.soldTicket)
    .map((ticket) => {
      const zone = event.eventZones.find((z) => z.id === ticket.eventZoneId);
      const soldTicket = ticket.soldTicket!;
      const eventDate = ticket.eventDate.date;

      return {
        id: soldTicket.ticketId,
        ticketId: ticket.id,
        seatNumber: ticket.seatNumber,
        zoneName: zone?.name || '',
        price: zone?.price || 0,
        currency: zone?.currency || currency,
        paymentMethod: soldTicket.paymentMethod,
        purchaseDate: soldTicket.soldAt.toISOString(),
        eventDate: eventDate.toISOString().split('T')[0],
        eventTime: eventDate.toTimeString().slice(0, 5),
        buyerName:
          `${soldTicket.buyer.userName} ${soldTicket.buyer.userSurname || ''}`.trim(),
        buyerEmail: soldTicket.buyer.email,
        contactName: soldTicket.purchaseContactInfo?.name,
        contactEmail: soldTicket.purchaseContactInfo?.email,
        contactPhone: soldTicket.purchaseContactInfo?.phone,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    );

  return {
    id: event.id,
    title: event.title,
    coverImg: event.coverImg || '',
    logoImg: event.logoImg || '',
    mainImg: event.mainImg || '',
    categories: event.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
    })),
    location: {
      country: event.country || '',
      state: event.state || '',
      city: event.city || '',
      street: event.street || '',
      buildingNumber: event.buildingNumber || '',
    },
    price: {
      min: minPrice,
      max: maxPrice,
      currency,
    },
    shortDescription: event.shortDescription,
    fullDescription: event.fullDescription,
    speakers: event.speakers.map((speaker) => ({
      id: speaker.id,
      userName: speaker.userName,
      userSurname: speaker.userSurname || '',
      email: speaker.email,
      avatarUrl: speaker.avatarUrl || '',
    })),
    owner: {
      id: event.owner.id,
      userName: event.owner.userName,
      userSurname: event.owner.userSurname || '',
      email: event.owner.email,
    },
    availableDates,
    statistics: {
      totalTickets,
      soldTickets,
      availableTickets,
      totalRevenue,
      currency,
      guestsCount,
      totalSeats,
    },
    bookings,
    selectedDate,
  };
}
