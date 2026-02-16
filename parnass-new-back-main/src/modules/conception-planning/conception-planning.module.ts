import { Module } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { PlanningController } from './controllers/planning.controller';
import { AlertRulesController } from './controllers/alert-rules.controller';
import { SubcontractorsController } from './controllers/subcontractors.controller';
import { PlanningService } from './services/planning.service';
import { AlertRulesService } from './services/alert-rules.service';
import { SubcontractorsService } from './services/subcontractors.service';

@Module({
  controllers: [
    PlanningController,
    AlertRulesController,
    SubcontractorsController,
  ],
  providers: [
    SupabaseService,
    PlanningService,
    AlertRulesService,
    SubcontractorsService,
  ],
  exports: [PlanningService, AlertRulesService, SubcontractorsService],
})
export class ConceptionPlanningModule {}
