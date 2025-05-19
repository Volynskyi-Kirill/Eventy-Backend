export enum EventImageType {
  COVER = 'cover',
  LOGO = 'logo',
  MAIN = 'main',
}

export function determineImageType(
  imagePath: string,
  coverImg?: string,
  logoImg?: string,
  mainImg?: string,
): EventImageType | null {
  switch (imagePath) {
    case coverImg:
      return EventImageType.COVER;
    case logoImg:
      return EventImageType.LOGO;
    case mainImg:
      return EventImageType.MAIN;
    default:
      return null;
  }
}

export function createTypedFilename(
  originalFilename: string,
  imageType: EventImageType,
): string {
  const fileExtension = originalFilename.substring(
    originalFilename.lastIndexOf('.'),
  );
  const fileNameWithoutExt = originalFilename.substring(
    0,
    originalFilename.lastIndexOf('.'),
  );

  return `${imageType}-${fileNameWithoutExt}${fileExtension}`;
}

/**
 * Maps image type to the corresponding database field name
 */
export function getImageFieldByType(imageType: EventImageType): string {
  switch (imageType) {
    case EventImageType.COVER:
      return 'coverImg';
    case EventImageType.LOGO:
      return 'logoImg';
    case EventImageType.MAIN:
      return 'mainImg';
    default:
      throw new Error(`Unknown image type: ${imageType}`);
  }
}

/**
 * Formats event data for recommendation display
 */
export function formatEventForRecommendation(event: any) {
  const lowestPriceZone = event.eventZones[0];

  const highestPriceZone =
    event.eventZones.length > 1
      ? event.eventZones.reduce(
          (max: any, zone: any) => (zone.price > max.price ? zone : max),
          event.eventZones[0],
        )
      : lowestPriceZone;

  const nearestDate = event.dates[0];

  const allDates = event.dates.map((dateObj: any) => ({
    date: dateObj.date.toISOString().split('T')[0],
    time: dateObj.date.toISOString().split('T')[1].substring(0, 5),
    dateObj: dateObj.date,
  }));

  return {
    id: event.id,
    title: event.title,
    description: event.shortDescription,
    categories: event.categories.map((category: any) => category.name),
    minPrice: lowestPriceZone?.price || 0,
    maxPrice: highestPriceZone?.price || 0,
    currency: lowestPriceZone?.currency || 'USD',
    numberOfSeats: event.eventZones.reduce(
      (total: number, zone: any) => total + zone.seatCount,
      0,
    ),
    nearestDate: nearestDate
      ? {
          date: nearestDate.date.toISOString().split('T')[0],
          time: nearestDate.date.toISOString().split('T')[1].substring(0, 5),
          dateObj: nearestDate.date,
        }
      : null,
    dates: allDates,
    country: event.country,
    city: event.city,
    backgroundImage: event.mainImg || event.coverImg,
    owner: event.owner,
  };
}
