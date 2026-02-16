import {
  Controller,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import {
  RHService,
  AbsenceDto,
  FormationDto,
  DocumentAlertDto,
  RHStatsDto,
} from '../services/rh.service';

@Controller('backoffice/rh')
export class RHController {
  private readonly logger = new Logger(RHController.name);

  constructor(private readonly rhService: RHService) {}

  /**
   * GET /backoffice/rh/absences
   * Récupère les absences (congés, maladie, etc.)
   */
  @Get('absences')
  async getAbsences(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AbsenceDto[]> {
    this.logger.debug(`Récupération absences: from=${from}, to=${to}`);
    return this.rhService.getAbsences(from, to);
  }

  /**
   * GET /backoffice/rh/formations
   * Récupère les formations planifiées
   */
  @Get('formations')
  async getFormations(): Promise<FormationDto[]> {
    this.logger.debug('Récupération formations');
    return this.rhService.getFormations();
  }

  /**
   * GET /backoffice/rh/documents
   * Récupère les alertes de documents (à renouveler)
   */
  @Get('documents')
  async getDocumentAlerts(): Promise<DocumentAlertDto[]> {
    this.logger.debug('Récupération alertes documents');
    return this.rhService.getDocumentAlerts();
  }

  /**
   * GET /backoffice/rh/stats
   * Récupère les statistiques RH
   */
  @Get('stats')
  async getStats(): Promise<RHStatsDto> {
    this.logger.debug('Récupération statistiques RH');
    return this.rhService.getStats();
  }
}
