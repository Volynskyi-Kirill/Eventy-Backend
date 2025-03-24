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
