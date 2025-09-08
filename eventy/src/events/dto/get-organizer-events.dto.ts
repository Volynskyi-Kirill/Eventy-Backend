import { IsOptional, IsEnum } from 'class-validator';

export enum EventStatus {
  UPCOMING = 'upcoming',
  PAST = 'past',
  ALL = 'all',
}

export class GetOrganizerEventsDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus = EventStatus.ALL;
}
