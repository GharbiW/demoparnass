import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePrestationDto } from './create-prestation.dto';

export class UpdatePrestationDto extends PartialType(
  OmitType(CreatePrestationDto, ['contractId'] as const),
) {}
