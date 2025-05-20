import * as path from 'path';

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export const TEMP_UPLOADS_DIR = path.join(UPLOADS_DIR, 'temp');

export const UPLOADS_URL_PREFIX = '/uploads';

export const TEMP_UPLOADS_URL_PREFIX = `${UPLOADS_URL_PREFIX}/temp`;

export const getUserDir = (userId: number, userName: string): string =>
  path.join(UPLOADS_DIR, `${userId}-${userName}`);

export const getEventDir = (userDir: string, eventId: number): string =>
  path.join(userDir, `event-${eventId}`);

export const getEventImageUrlPath = (
  userId: number,
  userName: string,
  eventId: number,
  filename: string,
): string =>
  `${UPLOADS_URL_PREFIX}/${userId}-${userName}/event-${eventId}/${filename}`;

// User avatar constants
export const PERSONAL_DIR = 'personal';

export const getUserPersonalDir = (userDir: string): string =>
  path.join(userDir, PERSONAL_DIR);

export const getUserAvatarPath = (
  userId: number,
  userName: string,
  filename: string,
): string =>
  `${UPLOADS_URL_PREFIX}/${userId}-${userName}/${PERSONAL_DIR}/${filename}`;

export const FILE_CLEANUP = {
  TEN_SECONDS: 10 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

export const DEFAULT = {
  SORT_BY: 'id',
  SORT_DIRECTION: 'desc',
  PAGE: 1,
  LIMIT: 10,
};
