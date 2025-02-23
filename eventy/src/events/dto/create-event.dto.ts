import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDateDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class CreateEventSocialMediaDto {
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  link: string;
}

export class CreateEventZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  seatCount: number;
}

// export class CreateEventCategoryDto {
//   @IsString()
//   @IsNotEmpty()
//   name: string;
// }

export class CreateEventDto {
  @IsNumber()
  ownerId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  //   @IsOptional()
  //   @IsArray()
  //   @ValidateNested({ each: true })
  //   @Type(() => CreateEventCategoryDto)
  //   categories?: CreateEventCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventDateDto)
  dates: CreateEventDateDto[];

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  buildingNumber?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  speakerIds?: number[];

  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @IsString()
  @IsNotEmpty()
  fullDescription: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventZoneDto)
  eventZones: CreateEventZoneDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventSocialMediaDto)
  socialMedia: CreateEventSocialMediaDto[];

  @IsOptional()
  @IsString()
  coverImg?: string;

  @IsOptional()
  @IsString()
  logoImg?: string;

  @IsOptional()
  @IsString()
  mainImg?: string;
}
