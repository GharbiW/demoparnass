import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommercialModule } from './modules/commercial/commercial.module';
import { ConceptionPlanningModule } from './modules/conception-planning/conception-planning.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    BackofficeModule,
    CommercialModule,
    ConceptionPlanningModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
