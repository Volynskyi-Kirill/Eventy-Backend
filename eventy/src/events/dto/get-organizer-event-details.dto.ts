import { IsOptional, IsDateString } from 'class-validator';

export class GetOrganizerEventDetailsDto {
  @IsOptional()
  @IsDateString()
  selectedDate?: string;
}
