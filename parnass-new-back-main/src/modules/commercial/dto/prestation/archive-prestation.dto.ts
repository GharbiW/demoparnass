import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ArchivePrestationDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
