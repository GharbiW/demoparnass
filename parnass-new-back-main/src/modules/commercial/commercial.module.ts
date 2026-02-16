import { Module } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { SharedModule } from '../shared';

// Controllers
import {
  ClientController,
  AddressController,
  ContactController,
  ContractController,
  PrestationController,
  RideController,
  ActivityController,
  CombinedImportController,
  DocumentController,
  TemplateController,
} from './controllers';

// Services
import {
  ClientService,
  AddressService,
  ContactService,
  ContractService,
  PrestationService,
  RideService,
  ActivityService,
  CombinedImportService,
  DocumentService,
  TemplateService,
} from './services';
import { PrestationCronService } from './services/prestation-cron.service';

@Module({
  imports: [SharedModule],
  controllers: [
    ClientController,
    AddressController,
    ContactController,
    ContractController,
    PrestationController,
    RideController,
    ActivityController,
    CombinedImportController,
    DocumentController,
    TemplateController,
  ],
  providers: [
    SupabaseService,
    ClientService,
    AddressService,
    ContactService,
    ContractService,
    PrestationService,
    RideService,
    ActivityService,
    CombinedImportService,
    DocumentService,
    TemplateService,
    PrestationCronService,
  ],
  exports: [
    ClientService,
    AddressService,
    ContactService,
    ContractService,
    PrestationService,
    RideService,
    ActivityService,
    CombinedImportService,
    DocumentService,
    TemplateService,
  ],
})
export class CommercialModule {}
