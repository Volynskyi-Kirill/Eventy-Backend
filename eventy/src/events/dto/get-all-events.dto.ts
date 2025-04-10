import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumberString,
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

export class PriceFilterDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? parseInt(value) : undefined))
  min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? parseInt(value) : undefined))
  max?: number;
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
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
  })
  categoryIds?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PriceFilterDto)
  @Transform(({ value, obj }) => {
    if (!obj.minPrice && !obj.maxPrice) return undefined;

    const dto = new PriceFilterDto();
    dto.min = obj.minPrice !== undefined ? parseInt(obj.minPrice) : undefined;
    dto.max = obj.maxPrice !== undefined ? parseInt(obj.maxPrice) : undefined;
    return dto;
  })
  price?: PriceFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationFilterDto)
  @Transform(({ value, obj }) => {
    if (!obj.country && !obj.state && !obj.city) return undefined;

    const dto = new LocationFilterDto();
    dto.country = obj.country;
    dto.state = obj.state;
    dto.city = obj.city;
    return dto;
  })
  location?: LocationFilterDto;

  // These properties are used for transformation only
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;
}
