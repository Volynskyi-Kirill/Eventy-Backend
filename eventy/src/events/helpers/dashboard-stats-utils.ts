import {
  Event,
  EventDate,
  EventZone,
  Category,
  Ticket,
  SoldTicket,
  User,
  TICKET_STATUS,
} from '@prisma/client';

export interface DashboardEventData extends Event {
  dates: EventDate[];
  eventZones: (EventZone & {
    tickets: (Ticket & {
      eventDate: EventDate;
      soldTicket?: SoldTicket;
    })[];
  })[];
  categories: Category[];
  owner: User;
}

export interface TopEventByRevenue {
  id: number;
  title: string;
  revenue: number;
  currency: string;
  ticketsSold: number;
  totalTickets: number;
  nextEventDate?: string;
}

export interface TopEventByTickets {
  id: number;
  title: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: number;
  currency: string;
  nextEventDate?: string;
}

export interface CategoryStats {
  id: number;
  name: string;
  eventCount: number;
  totalRevenue: number;
  ticketsSold: number;
  percentage: number;
}

export interface RecentEvent {
  id: number;
  title: string;
  createdAt: string;
  nextEventDate?: string;
  totalTickets: number;
  ticketsSold: number;
}

export interface UpcomingEvent {
  id: number;
  title: string;
  nextEventDate: string;
  totalTickets: number;
  ticketsSold: number;
  revenue: number;
  currency: string;
}

export interface DashboardStats {
  // Overall statistics
  totalEvents: number;
  eventsThisMonth: number;
  totalTicketsCreated: number;
  totalTicketsSold: number;
  totalRevenue: number;
  averageRevenuePerEvent: number;
  currency: string;

  // Top events
  topEventsByRevenue: TopEventByRevenue[];
  topEventsByTickets: TopEventByTickets[];

  // Category distribution
  categoryStats: CategoryStats[];

  // Recent activity
  recentEvents: RecentEvent[];
  upcomingEvents: UpcomingEvent[];
}

export function calculateDashboardStats(
  events: DashboardEventData[],
): DashboardStats {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Initialize stats
  let totalTicketsCreated = 0;
  let totalTicketsSold = 0;
  let totalRevenue = 0;
  const currency = 'UAH'; // Default currency

  // Category aggregation
  const categoryMap = new Map<
    number,
    {
      id: number;
      name: string;
      eventCount: number;
      totalRevenue: number;
      ticketsSold: number;
    }
  >();

  // Event stats for top lists
  const eventStats: Array<{
    id: number;
    title: string;
    revenue: number;
    ticketsSold: number;
    totalTickets: number;
    nextEventDate?: Date;
    createdAt: Date;
  }> = [];

  // Process each event
  events.forEach((event) => {
    let eventRevenue = 0;
    let eventTicketsSold = 0;
    let eventTotalTickets = 0;

    // Find next event date
    const nextDate = event.dates
      .filter((date) => date.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    // Calculate tickets and revenue for this event
    event.eventZones.forEach((zone) => {
      zone.tickets.forEach((ticket) => {
        eventTotalTickets++;
        totalTicketsCreated++;

        if (ticket.status === TICKET_STATUS.SOLD) {
          eventTicketsSold++;
          totalTicketsSold++;
          eventRevenue += zone.price;
          totalRevenue += zone.price;
        }
      });
    });

    // Store event stats
    eventStats.push({
      id: event.id,
      title: event.title,
      revenue: eventRevenue,
      ticketsSold: eventTicketsSold,
      totalTickets: eventTotalTickets,
      nextEventDate: nextDate?.date,
      createdAt: event.createdAt,
    });

    // Aggregate category stats
    event.categories.forEach((category) => {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          eventCount: 0,
          totalRevenue: 0,
          ticketsSold: 0,
        });
      }

      const catStats = categoryMap.get(category.id)!;
      catStats.eventCount++;
      catStats.totalRevenue += eventRevenue;
      catStats.ticketsSold += eventTicketsSold;
    });
  });

  // Calculate derived stats
  const totalEvents = events.length;
  const eventsThisMonth = events.filter(
    (event) => event.createdAt >= thisMonthStart,
  ).length;
  const averageRevenuePerEvent =
    totalEvents > 0 ? totalRevenue / totalEvents : 0;

  // Top events by revenue
  const topEventsByRevenue: TopEventByRevenue[] = eventStats
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .map((event) => ({
      id: event.id,
      title: event.title,
      revenue: event.revenue,
      currency,
      ticketsSold: event.ticketsSold,
      totalTickets: event.totalTickets,
      nextEventDate: event.nextEventDate?.toISOString(),
    }));

  // Top events by tickets sold
  const topEventsByTickets: TopEventByTickets[] = eventStats
    .sort((a, b) => b.ticketsSold - a.ticketsSold)
    .slice(0, 3)
    .map((event) => ({
      id: event.id,
      title: event.title,
      ticketsSold: event.ticketsSold,
      totalTickets: event.totalTickets,
      revenue: event.revenue,
      currency,
      nextEventDate: event.nextEventDate?.toISOString(),
    }));

  // Category stats with percentages
  const categoryStats: CategoryStats[] = Array.from(categoryMap.values())
    .map((cat) => ({
      ...cat,
      percentage:
        totalEvents > 0 ? Math.round((cat.eventCount / totalEvents) * 100) : 0,
    }))
    .sort((a, b) => b.eventCount - a.eventCount);

  // Recent events (last 5 created)
  const recentEvents: RecentEvent[] = eventStats
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((event) => ({
      id: event.id,
      title: event.title,
      createdAt: event.createdAt.toISOString(),
      nextEventDate: event.nextEventDate?.toISOString(),
      totalTickets: event.totalTickets,
      ticketsSold: event.ticketsSold,
    }));

  // Upcoming events (next 5 by date)
  const upcomingEvents: UpcomingEvent[] = eventStats
    .filter((event) => event.nextEventDate)
    .sort((a, b) => a.nextEventDate!.getTime() - b.nextEventDate!.getTime())
    .slice(0, 5)
    .map((event) => ({
      id: event.id,
      title: event.title,
      nextEventDate: event.nextEventDate!.toISOString(),
      totalTickets: event.totalTickets,
      ticketsSold: event.ticketsSold,
      revenue: event.revenue,
      currency,
    }));

  return {
    totalEvents,
    eventsThisMonth,
    totalTicketsCreated,
    totalTicketsSold,
    totalRevenue,
    averageRevenuePerEvent,
    currency,
    topEventsByRevenue,
    topEventsByTickets,
    categoryStats,
    recentEvents,
    upcomingEvents,
  };
}
