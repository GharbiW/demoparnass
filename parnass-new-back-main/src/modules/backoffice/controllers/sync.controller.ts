import {
  Controller,
  Get,
  Post,
  Logger,
  Query,
} from '@nestjs/common';
import { SyncService } from '../services/sync.service';
import { FactorialService } from '../services/factorial.service';
import { SyncResultDto, SyncStatusDto, SyncHistoryEntryDto } from '../dto/sync.dto';

@Controller('backoffice/sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly factorialService: FactorialService,
  ) {}

  /**
   * POST /backoffice/sync/drivers
   * Synchronize drivers from Factorial API
   */
  @Post('drivers')
  async syncDrivers(): Promise<SyncResultDto> {
    this.logger.log('Démarrage synchronisation manuelle des conducteurs');
    return this.syncService.syncDrivers('manual');
  }

  /**
   * POST /backoffice/sync/vehicles
   * Synchronize vehicles from MyRentCar API
   */
  @Post('vehicles')
  async syncVehicles(): Promise<SyncResultDto> {
    this.logger.log('Démarrage synchronisation manuelle des véhicules');
    return this.syncService.syncVehicles('manual');
  }

  /**
   * POST /backoffice/sync/all
   * Synchronize both drivers and vehicles
   */
  @Post('all')
  async syncAll(): Promise<{
    drivers: SyncResultDto;
    vehicles: SyncResultDto;
  }> {
    this.logger.log('Démarrage synchronisation manuelle complète');
    return this.syncService.syncAll('manual');
  }

  /**
   * GET /backoffice/sync/status
   * Get current sync status
   */
  @Get('status')
  async getStatus(): Promise<SyncStatusDto> {
    return this.syncService.getStatus();
  }

  /**
   * GET /backoffice/sync/history
   * Get sync history
   */
  @Get('history')
  async getHistory(
    @Query('limit') limit?: number,
  ): Promise<SyncHistoryEntryDto[]> {
    return this.syncService.getHistory(limit || 10);
  }

  /**
   * GET /backoffice/sync/debug/factorial
   * Debug endpoint — test each Factorial API call individually
   * Returns counts and sample data to help diagnose issues
   */
  @Get('debug/factorial')
  async debugFactorial(): Promise<any> {
    const results: any = {
      timestamp: new Date().toISOString(),
      apiVersion: '2026-01-01',
      endpoints: {},
    };

    // Test employees
    try {
      const employees = await this.factorialService.getAllEmployees();
      results.endpoints.employees = {
        status: 'OK',
        count: employees.length,
        sample: employees.slice(0, 2).map((e) => ({
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          email: e.email,
          login_email: e.login_email,
          phone_number: e.phone_number,
          address_line_1: e.address_line_1,
          city: e.city,
          active: e.active,
        })),
      };
    } catch (err: any) {
      results.endpoints.employees = { status: 'ERROR', error: err?.message || String(err) };
    }

    // Test teams
    try {
      const teams = await this.factorialService.getAllTeams();
      results.endpoints.teams = {
        status: 'OK',
        count: teams.length,
        data: teams.map((t) => ({
          id: t.id,
          name: t.name,
          employee_count: t.employee_ids?.length || 0,
        })),
      };
    } catch (err: any) {
      results.endpoints.teams = { status: 'ERROR', error: err?.message || String(err) };
    }

    // Test memberships
    try {
      const memberships = await this.factorialService.getTeamMemberships();
      results.endpoints.memberships = {
        status: 'OK',
        count: memberships.length,
        sample: memberships.slice(0, 5),
      };
    } catch (err: any) {
      results.endpoints.memberships = { status: 'ERROR', error: err?.message || String(err) };
    }

    // Test custom fields
    try {
      const fields = await this.factorialService.getCustomFields();
      results.endpoints.customFields = {
        status: 'OK',
        count: fields.length,
        data: fields.map((f) => ({
          id: f.id,
          label: f.label,
          slug: f.slug,
          name: (f as any).name,
          field_type: f.field_type,
          required: f.required,
          position: f.position,
        })),
      };
    } catch (err: any) {
      results.endpoints.customFields = { status: 'ERROR', error: err?.message || String(err) };
    }

    // Test custom field values (just count + sample)
    try {
      const values = await this.factorialService.getCustomFieldValues();
      results.endpoints.customFieldValues = {
        status: 'OK',
        count: values.length,
        sample: values.slice(0, 10).map((v) => ({
          id: v.id,
          field_id: v.field_id,
          custom_field_id: (v as any).custom_field_id,
          employee_id: v.employee_id,
          value: v.value,
          option_id: v.option_id,
        })),
      };
    } catch (err: any) {
      results.endpoints.customFieldValues = { status: 'ERROR', error: err?.message || String(err) };
    }

    // Test custom field options
    try {
      const options = await this.factorialService.getCustomFieldOptions();
      results.endpoints.customFieldOptions = {
        status: 'OK',
        count: options.length,
        data: options.map((o) => ({
          id: o.id,
          field_id: o.field_id,
          custom_field_id: (o as any).custom_field_id,
          label: o.label,
          value: (o as any).value,
        })),
      };
    } catch (err: any) {
      results.endpoints.customFieldOptions = { status: 'ERROR', error: err?.message || String(err) };
    }

    // Test leaves (today)
    try {
      const today = new Date().toISOString().split('T')[0];
      const leaves = await this.factorialService.getLeaves(today, today);
      results.endpoints.leaves = {
        status: 'OK',
        count: leaves.length,
        date: today,
        sample: leaves.slice(0, 3),
      };
    } catch (err: any) {
      results.endpoints.leaves = { status: 'ERROR', error: err?.message || String(err) };
    }

    // Test open shifts
    try {
      const shifts = await this.factorialService.getOpenShifts();
      results.endpoints.openShifts = {
        status: 'OK',
        count: shifts.length,
        sample: shifts.slice(0, 3),
      };
    } catch (err: any) {
      results.endpoints.openShifts = { status: 'ERROR', error: err?.message || String(err) };
    }

    return results;
  }
}
