import { Event, EventDate, EventZone, Category, Ticket } from '@prisma/client';

export interface OrganizerEventData extends Event {
  dates: (EventDate & { tickets: Ticket[] })[];
  eventZones: (EventZone & { tickets: Ticket[] })[];
  categories: Category[];
}

export interface OrganizerEventCard {
  id: number;
  title: string;
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
  seats: {
    total: number;
    available: number;
  };
  dates: string[];
  nearestDate: string | null;
  status: 'upcoming' | 'past';
}

export interface GroupedOrganizerEvents {
  upcoming: OrganizerEventCard[];
  past: OrganizerEventCard[];
}

export function transformOrganizerEventData(
  events: OrganizerEventData[],
): GroupedOrganizerEvents {
  const currentDate = new Date();
  const upcoming: OrganizerEventCard[] = [];
  const past: OrganizerEventCard[] = [];

  events.forEach((event) => {
    const transformedEvent = transformSingleOrganizerEvent(event);

    // Determine if event is upcoming or past based on nearest date
    const eventDates = event.dates.map((date) => new Date(date.date));
    const nearestDate = eventDates.reduce((nearest, current) => {
      return current < nearest ? current : nearest;
    }, eventDates[0]);

    if (nearestDate && nearestDate >= currentDate) {
      transformedEvent.status = 'upcoming';
      upcoming.push(transformedEvent);
    } else {
      transformedEvent.status = 'past';
      past.push(transformedEvent);
    }
  });

  // Sort upcoming events by nearest date (earliest first)
  upcoming.sort((a, b) => {
    const dateA = a.nearestDate ? new Date(a.nearestDate) : new Date();
    const dateB = b.nearestDate ? new Date(b.nearestDate) : new Date();
    return dateA.getTime() - dateB.getTime();
  });

  // Sort past events by nearest date (latest first)
  past.sort((a, b) => {
    const dateA = a.nearestDate ? new Date(a.nearestDate) : new Date();
    const dateB = b.nearestDate ? new Date(b.nearestDate) : new Date();
    return dateB.getTime() - dateA.getTime();
  });

  return { upcoming, past };
}

function transformSingleOrganizerEvent(
  event: OrganizerEventData,
): OrganizerEventCard {
  // Calculate price range
  const prices = event.eventZones.map((zone) => zone.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currency = event.eventZones[0]?.currency || 'UAH';

  // Calculate seat availability
  const totalSeats = event.eventZones.reduce(
    (total, zone) => total + zone.seatCount,
    0,
  );

  // Count available tickets from all eventZones
  const availableSeats = event.eventZones.reduce((total, zone) => {
    const availableInZone = zone.tickets.filter(
      (ticket) => ticket.status === 'AVAILABLE',
    ).length;
    return total + availableInZone;
  }, 0);

  // Get all dates and find nearest
  const eventDates = event.dates.map((date) => date.date);
  const sortedDates = eventDates
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());
  const nearestDate = sortedDates[0]?.toISOString() || null;

  return {
    id: event.id,
    title: event.title,
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
    seats: {
      total: totalSeats,
      available: availableSeats,
    },
    dates: eventDates.map((date) => date.toISOString()),
    nearestDate,
    status: 'upcoming', // Will be set properly in the main function
  };
}
