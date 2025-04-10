import { Prisma } from '@prisma/client';
import { GetAllEventsDto } from '../dto/get-all-events.dto';

export function buildEventWhereClause(
  dto: GetAllEventsDto,
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {};

  if (dto.categoryIds?.length) {
    where.categories = {
      some: {
        id: {
          in: dto.categoryIds,
        },
      },
    };
  }

  if (dto.location?.country) {
    where.country = dto.location.country;
  }

  if (dto.location?.state) {
    where.state = dto.location.state;
  }

  if (dto.location?.city) {
    where.city = dto.location.city;
  }

  const isPriceFilter =
    dto.price?.min !== undefined || dto.price?.max !== undefined;
  if (isPriceFilter) {
    where.eventZones = {
      some: {
        AND: [
          dto.price?.min !== undefined ? { price: { gte: dto.price.min } } : {},
          dto.price?.max !== undefined ? { price: { lte: dto.price.max } } : {},
        ],
      },
    };
  }

  return where;
}

export function createOrderByObject(
  sortBy: string,
  sortDirection: string,
): any {
  const orderBy: any = {};
  orderBy[sortBy] = sortDirection;
  return orderBy;
}

export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function transformEventData(events: any[]): any[] {
  return events.map((event) => {
    const totalSeats = event.eventZones.reduce(
      (sum: number, zone: any) => sum + zone.seatCount,
      0,
    );

    const availableSeats = totalSeats;

    const allPrices = event.eventZones.map((zone: any) => zone.price);

    return {
      id: event.id,
      title: event.title,
      mainImg: event.mainImg,
      categories: event.categories,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      location: {
        country: event.country,
        state: event.state,
        city: event.city,
        street: event.street,
        buildingNumber: event.buildingNumber,
      },
      price: {
        min: allPrices.length ? Math.min(...allPrices) : null,
        max: allPrices.length ? Math.max(...allPrices) : null,
        currency: event.eventZones[0]?.currency || 'USD',
      },
      seats: {
        total: totalSeats,
        available: availableSeats,
      },
      dates: event.dates.map((date: any) => date.date),
    };
  });
}

export function buildPaginationMetadata(
  total: number,
  page: number,
  limit: number,
) {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
