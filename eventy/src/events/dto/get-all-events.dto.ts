import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DEFAULT } from '../helpers/constants';

enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class LocationFilterDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class GetAllEventsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value !== undefined ? parseInt(value) : 1))
  page: number = DEFAULT.PAGE;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value !== undefined ? parseInt(value) : 10))
  limit: number = DEFAULT.LIMIT;

  @IsOptional()
  @IsString()
  sortBy: string = DEFAULT.SORT_BY;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.DESC;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return value
      .split(',')
      .map((id: string) => parseInt(id))
      .filter((id: number) => !isNaN(id));
  })
  categoryIds?: number[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  maxPrice?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationFilterDto)
  @Transform(({ obj }) => {
    if (!obj.country && !obj.state && !obj.city) return undefined;

    const dto = new LocationFilterDto();
    dto.country = obj.country;
    dto.state = obj.state;
    dto.city = obj.city;
    return dto;
  })
  location?: LocationFilterDto;
}
