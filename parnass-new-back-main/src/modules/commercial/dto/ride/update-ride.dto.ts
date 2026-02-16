import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRideDto } from './create-ride.dto';

export class UpdateRideDto extends PartialType(
  OmitType(CreateRideDto, ['prestationId'] as const),
) {}
