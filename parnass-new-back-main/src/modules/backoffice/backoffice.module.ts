import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';

// Config
import { SupabaseService } from '../../config/supabase.service';

// Controllers
import { DriversController } from './controllers/drivers.controller';
import { VehiclesController } from './controllers/vehicles.controller';
import { SyncController } from './controllers/sync.controller';
import { RHController } from './controllers/rh.controller';
import { SitesController } from './controllers/sites.controller';

// Services
import { FactorialService } from './services/factorial.service';
import { MyRentACarService } from './services/my-rent-a-car.service';
import { DriversCacheService } from './services/drivers-cache.service';
import { VehiclesCacheService } from './services/vehicles-cache.service';
import { SyncService } from './services/sync.service';
import { RHService } from './services/rh.service';
import { WincplXmlParserService } from './services/wincpl-xml-parser.service';
import { SitesService } from './services/sites.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    MulterModule.register({
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max per file
    }),
  ],
  controllers: [
    DriversController,
    VehiclesController,
    SyncController,
    RHController,
    SitesController,
  ],
  providers: [
    SupabaseService,
    FactorialService,
    MyRentACarService,
    DriversCacheService,
    VehiclesCacheService,
    SyncService,
    RHService,
    WincplXmlParserService,
    SitesService,
  ],
  exports: [
    FactorialService,
    MyRentACarService,
    DriversCacheService,
    VehiclesCacheService,
    SyncService,
    RHService,
    WincplXmlParserService,
    SitesService,
  ],
})
export class BackofficeModule {}
