import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsInt,
} from 'class-validator';

export class ContactInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsBoolean()
  agreeToTerms: boolean;

  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;
}

export class PurchaseTicketDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ticketIds: number[];

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;
}
