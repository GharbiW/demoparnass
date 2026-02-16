import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { UpdatePrestationDto } from './update-prestation.dto';

export class ScheduleModificationDto extends UpdatePrestationDto {
  @IsDateString()
  @IsNotEmpty({ message: "La date d'effet est requise" })
  dateEffet: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeDescription?: string;
}
