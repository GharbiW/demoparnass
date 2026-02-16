import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrestationService } from './prestation.service';

@Injectable()
export class PrestationCronService {
  private readonly logger = new Logger(PrestationCronService.name);

  constructor(private readonly prestationService: PrestationService) {}

  /**
   * Runs daily at midnight to apply scheduled prestation versions
   * whose date_effet has passed.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleScheduledVersions() {
    this.logger.log('Running scheduled version application job...');

    try {
      const result = await this.prestationService.applyScheduledVersions();

      if (result.applied > 0 || result.errors > 0) {
        this.logger.log(
          `Scheduled versions job completed: ${result.applied} applied, ${result.errors} errors`,
        );
      } else {
        this.logger.log('No scheduled versions to apply');
      }
    } catch (error) {
      this.logger.error('Scheduled versions job failed', error);
    }
  }
}
