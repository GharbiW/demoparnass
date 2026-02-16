import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsEmail,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  role?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsBoolean()
  @IsOptional()
  isNotifiableExploitation?: boolean;
}
