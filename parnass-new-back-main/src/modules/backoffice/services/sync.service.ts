import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { FactorialService } from './factorial.service';
import { MyRentACarService } from './my-rent-a-car.service';
import { DriversCacheService } from './drivers-cache.service';
import { VehiclesCacheService } from './vehicles-cache.service';
import { WincplXmlParserService } from './wincpl-xml-parser.service';
import { SyncResultDto, SyncStatusDto, SyncHistoryEntryDto } from '../dto/sync.dto';
import {
  FactorialTeam,
  FactorialCustomField,
  FactorialCustomFieldValue,
  FactorialCustomFieldOption,
  FactorialLeave,
} from '../types/factorial.types';
import { WincplImportResult } from '../types/wincpl.types';

// Keyword to filter driver teams — any team whose name contains "CHAUFFEUR"
// Actual Factorial driver teams:
//   id=112074 "CHAUFFEURS SPL"   (275 members)
//   id=112460 "CHAUFFEUR CM"     (135 members)
//   id=112490 "CHAUFFEUR POLYVALENTS" (24 members)
//   id=243208 "CHAUFFEURS VL"    (5 members)
const DRIVER_TEAM_KEYWORD = 'CHAUFFEUR';

// Known Factorial custom field IDs (hardcoded fallback when slug/label matching fails)
// Format: factorialFieldId -> slug key used in CUSTOM_FIELD_SLUG_MAP
// IDs from: https://apidoc.factorialhr.com/reference/get_api-2026-01-01-resources-custom-fields-fields
const KNOWN_FIELD_IDS: Record<number, string> = {
  4340133: 'lieu_de_prise_de_poste',     // Lieu de prise de poste (text, position=1)
  4644223: 'date_remise_carte_as_24',     // Date remise carte AS 24 (date, position=4)
  5443632: 'numeros_cartes_as_24',        // Numéros Cartes AS 24 (text, position=3)
  5443630: 'date_de_restitution_as_24',   // Date de restitution AS 24 (date, position=6)
  6170303: 'shift',                       // Shift (single_choice, position=7)
  6040452: 'forfait_weekend',             // Forfait Week-End (single_choice, position=8)
  6248949: 'permis_de_conduire',          // Permis de conduire (date, position=0)
  6248951: 'fco',                         // FCO (date, position=1)
  6248952: 'adr',                         // ADR (date, position=2)
  6249315: 'habilitation',                // Habilitation (text, position=3)
  6248955: 'formation_11239_et_11262',    // Formation 11.2.3.9 et 11.2.6.2 (date, position=4)
  6248971: 'visite_medicale',             // Visite médicale (date, position=5)
};

// Custom field slugs we want to map (slug -> DB column)
const CUSTOM_FIELD_SLUG_MAP: Record<string, string> = {
  lieu_de_prise_de_poste: 'lieu_prise_poste',
  date_remise_carte_as_24: 'date_remise_carte_as24',
  numeros_cartes_as_24: 'numero_carte_as24',
  date_de_restitution_as_24: 'date_restitution_as24',
  shift: 'shift',
  forfait_weekend: 'forfait_weekend',
  permis_de_conduire: 'permis_de_conduire',
  fco: 'fco',
  adr: 'adr',
  habilitation: 'habilitation',
  formation_11239_et_11262: 'formation_11239_11262',
  visite_medicale: 'visite_medicale',
};

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly factorialService: FactorialService,
    private readonly myRentACarService: MyRentACarService,
    private readonly driversCacheService: DriversCacheService,
    private readonly vehiclesCacheService: VehiclesCacheService,
    private readonly wincplXmlParser: WincplXmlParserService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Create a sync status record
   */
  private async createSyncRecord(
    entityType: 'drivers' | 'vehicles' | 'all',
    triggeredBy?: string,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('sync_status')
      .insert({
        entity_type: entityType,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        triggered_by: triggeredBy,
      })
      .select('id')
      .single();

    if (error) {
      this.logger.error('Erreur création sync record', error);
      throw new BadRequestException(error.message);
    }

    return data.id;
  }

  /**
   * Update a sync status record
   */
  private async updateSyncRecord(
    id: string,
    data: {
      status: 'completed' | 'failed';
      records_synced?: number;
      records_created?: number;
      records_updated?: number;
      error_message?: string;
    },
  ): Promise<void> {
    const { error } = await this.supabase
      .from('sync_status')
      .update({
        status: data.status,
        completed_at: new Date().toISOString(),
        records_synced: data.records_synced,
        records_created: data.records_created,
        records_updated: data.records_updated,
        error_message: data.error_message,
      })
      .eq('id', id);

    if (error) {
      this.logger.error('Erreur mise à jour sync record', error);
    }
  }

  /**
   * Build address from Factorial employee data
   */
  private buildAddress(employee: any): string | undefined {
    const parts: string[] = [];
    if (employee.address_line_1) parts.push(employee.address_line_1);
    if (employee.postal_code && employee.city) {
      parts.push(`${employee.postal_code} ${employee.city}`);
    } else if (employee.city) {
      parts.push(employee.city);
    }
    if (employee.country) parts.push(employee.country);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  /**
   * Find team name for an employee
   */
  private findTeamForEmployee(
    employeeId: number,
    teams: FactorialTeam[],
  ): { teamId: number; teamName: string } | null {
    for (const team of teams) {
      if (team.employee_ids?.includes(employeeId)) {
        return { teamId: team.id, teamName: team.name };
      }
    }
    return null;
  }

  /**
   * Build a robust lookup for custom fields.
   * Uses multiple strategies: slug, name, label normalization, and hardcoded field IDs.
   * Returns: Map<slugKey, FactorialCustomField> where slugKey matches CUSTOM_FIELD_SLUG_MAP keys.
   */
  private buildCustomFieldSlugMap(
    customFields: FactorialCustomField[],
  ): Map<string, FactorialCustomField> {
    const map = new Map<string, FactorialCustomField>();

    // Strategy 1: Try slug property
    for (const field of customFields) {
      if (field.slug && CUSTOM_FIELD_SLUG_MAP[field.slug]) {
        map.set(field.slug, field);
      }
    }

    // Strategy 2: Try name property (some API versions use name instead of slug)
    for (const field of customFields) {
      const nameKey = (field as any).name;
      if (nameKey && CUSTOM_FIELD_SLUG_MAP[nameKey] && !map.has(nameKey)) {
        map.set(nameKey, field);
      }
    }

    // Strategy 3: Normalize label (or label_text for v2026) to slug-like format
    for (const field of customFields) {
      const labelRaw = field.label || field.label_text;
      if (labelRaw) {
        const normalized = labelRaw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');

        if (CUSTOM_FIELD_SLUG_MAP[normalized] && !map.has(normalized)) {
          map.set(normalized, field);
        }

        // Also try without accent removal
        const normalizedKeep = labelRaw
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_àâäéèêëïîôùûüÿçœæ]/g, '');

        if (CUSTOM_FIELD_SLUG_MAP[normalizedKeep] && !map.has(normalizedKeep)) {
          map.set(normalizedKeep, field);
        }
      }
    }

    // Strategy 4: Fallback to hardcoded field IDs
    for (const field of customFields) {
      const knownSlug = KNOWN_FIELD_IDS[field.id];
      if (knownSlug && !map.has(knownSlug)) {
        map.set(knownSlug, field);
        this.logger.debug(`Custom field mapped by ID: ${field.id} -> ${knownSlug} (label: "${field.label}")`);
      }
    }

    return map;
  }

  /**
   * Build a lookup: option_id -> option label (for single_choice fields)
   */
  private buildOptionLabelMap(
    options: FactorialCustomFieldOption[],
  ): Map<number, string> {
    const map = new Map<number, string>();
    for (const opt of options) {
      map.set(opt.id, opt.label);
    }
    return map;
  }

  /**
   * Get effective employee ID from a custom field value
   * v2025 API uses employee_id, v2026 uses valuable_id
   */
  private getEmployeeIdFromValue(v: FactorialCustomFieldValue): number | undefined {
    return v.employee_id ?? v.valuable_id;
  }

  /**
   * Get the best string value from a custom field value entry.
   * v2026 API has typed value fields: date_value, single_choice_value, etc.
   */
  private getResolvedValue(
    v: FactorialCustomFieldValue,
    fieldDef: FactorialCustomField,
    optionLabelMap: Map<number, string>,
  ): string | undefined {
    // For single_choice fields
    if (fieldDef.field_type === 'single_choice') {
      // v2026: single_choice_value contains the label directly
      if (v.single_choice_value) {
        return v.single_choice_value;
      }
      // v2025: option_id needs to be resolved via optionLabelMap
      if (v.option_id) {
        return optionLabelMap.get(v.option_id) || v.value;
      }
      // Fallback to raw value
      return v.value || undefined;
    }

    // For date fields, prefer date_value (v2026)
    if (fieldDef.field_type === 'date') {
      return v.date_value || v.value || undefined;
    }

    // For all other types
    return v.long_text_value || v.value || undefined;
  }

  /**
   * Resolve all mapped custom field values for a given employee.
   * Returns a flat object keyed by DB column name.
   * Compatible with both v2025 (employee_id, option_id) and v2026 (valuable_id, single_choice_value) APIs.
   */
  private resolveCustomFields(
    employeeId: number,
    slugFieldMap: Map<string, FactorialCustomField>,
    customFieldValues: FactorialCustomFieldValue[],
    optionLabelMap: Map<number, string>,
    contractToEmployeeMap: Map<number, number>,
    customResourceToEmployeeMap: Map<number, number>,
  ): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};

    // Pre-filter values for this employee
    // In v2026, valuable_type indicates the source:
    //   - Employee: valuable_id is employee_id directly
    //   - Contracts::ContractVersion: valuable_id → contractToEmployeeMap → employee_id
    //   - CustomResources::Value: valuable_id → customResourceToEmployeeMap → employee_id (attachable_id)
    const empValues = customFieldValues.filter((v) => {
      let resolvedEmployeeId: number | undefined;
      const vid = v.valuable_id ?? v.employee_id;

      if (!v.valuable_type || v.valuable_type === 'Employee') {
        // Direct employee field
        resolvedEmployeeId = vid;
      } else if (v.valuable_type === 'Contracts::ContractVersion') {
        // Contract version → look up employee
        resolvedEmployeeId = vid ? contractToEmployeeMap.get(vid) : undefined;
      } else if (v.valuable_type === 'CustomResources::Value') {
        // Custom resource value → look up employee via attachable_id
        resolvedEmployeeId = vid ? customResourceToEmployeeMap.get(vid) : undefined;
      } else if (v.valuable_type === 'Document') {
        // Skip document values — not employee-related
        return false;
      } else {
        // Unknown type — try direct match as fallback
        resolvedEmployeeId = vid;
      }

      return resolvedEmployeeId === employeeId;
    });

    for (const [slug, dbColumn] of Object.entries(CUSTOM_FIELD_SLUG_MAP)) {
      const fieldDef = slugFieldMap.get(slug);
      if (!fieldDef) {
        result[dbColumn] = undefined;
        continue;
      }

      // Match by field_id or custom_field_id (API version compatibility)
      // Find ALL matching entries and take the most recent (highest id)
      const matchingEntries = empValues
        .filter(
          (v) =>
            v.field_id === fieldDef.id ||
            (v as any).custom_field_id === fieldDef.id,
        )
        .sort((a, b) => b.id - a.id); // Most recent first
      const valEntry = matchingEntries[0];
      if (!valEntry) {
        result[dbColumn] = undefined;
        continue;
      }

      // Resolve the value using the appropriate field
      const resolved = this.getResolvedValue(valEntry, fieldDef, optionLabelMap);
      result[dbColumn] = resolved || undefined;
    }

    return result;
  }

  /**
   * Sync drivers from Factorial API to cache.
   *
   * 1. Filter employees by team "Conducteurs Routier SPL" (via team memberships or team.employee_ids).
   * 2. Map ALL 12 custom fields by slug/ID, resolving single_choice via options.
   * 3. Check today's leaves to compute availability (indisponible).
   */
  async syncDrivers(triggeredBy?: string): Promise<SyncResultDto> {
    const startTime = Date.now();
    const syncId = await this.createSyncRecord('drivers', triggeredBy);

    try {
      this.logger.log('Démarrage synchronisation des conducteurs depuis Factorial...');

      // ── Step 1 : Fetch all reference data in parallel ──
      const [
        employees,
        teams,
        memberships,
        customFields,
        customFieldValues,
        customFieldOptions,
        contractVersions,
        customResourceValues,
      ] = await Promise.all([
        this.factorialService.getAllEmployees(),
        this.factorialService.getAllTeams(),
        this.factorialService.getTeamMemberships(),
        this.factorialService.getCustomFields(),
        this.factorialService.getCustomFieldValues(),
        this.factorialService.getCustomFieldOptions(),
        this.factorialService.getContractVersions(),
        this.factorialService.getAllCustomResourceValues(),
      ]);

      this.logger.log(
        `Factorial: ${employees.length} employés, ${teams.length} équipes, ${memberships.length} memberships, ${customFields.length} champs perso, ${customFieldValues.length} valeurs, ${customFieldOptions.length} options, ${contractVersions.length} contrats, ${customResourceValues.length} custom resource values récupérés`,
      );

      // ── Build valuable_id → employee_id mapping tables ──
      // For Contracts::ContractVersion: contract version id → employee_id
      const contractToEmployeeMap = new Map<number, number>();
      for (const cv of contractVersions) {
        contractToEmployeeMap.set(cv.id, cv.employee_id);
      }
      // For CustomResources::Value: custom resource value id → attachable_id (employee_id)
      const customResourceToEmployeeMap = new Map<number, number>();
      for (const crv of customResourceValues) {
        customResourceToEmployeeMap.set(crv.id, crv.attachable_id);
      }
      this.logger.log(
        `Mapping tables: ${contractToEmployeeMap.size} contrats, ${customResourceToEmployeeMap.size} custom resources`,
      );

      // Log all custom fields for debugging — VERBOSE to diagnose field mapping
      for (const f of customFields) {
        this.logger.log(
          `CF: id=${f.id} slug="${f.slug || ''}" label="${f.label || f.label_text || ''}" type=${f.field_type}`,
        );
      }

      // ── Step 2 : Identify ALL driver teams and their members ──
      // Match any team whose name contains "CHAUFFEUR" (case-insensitive)
      const driverTeams = teams.filter((t) =>
        t.name.toUpperCase().includes(DRIVER_TEAM_KEYWORD.toUpperCase()),
      );

      let driverEmployeeIds: Set<number>;

      // Build a map: employeeId -> driverTeamName (for teamName display)
      const employeeDriverTeamMap = new Map<number, { teamId: number; teamName: string }>();

      if (driverTeams.length > 0) {
        driverEmployeeIds = new Set<number>();

        for (const driverTeam of driverTeams) {
          // Use memberships if available, otherwise fall back to team.employee_ids
          const teamMembershipIds = memberships
            .filter((m) => m.team_id === driverTeam.id)
            .map((m) => m.employee_id);

          const memberIds =
            teamMembershipIds.length > 0
              ? teamMembershipIds
              : driverTeam.employee_ids || [];

          for (const eid of memberIds) {
            driverEmployeeIds.add(eid);
            // Store team info (last one wins if employee is in multiple driver teams)
            employeeDriverTeamMap.set(eid, {
              teamId: driverTeam.id,
              teamName: driverTeam.name.trim(),
            });
          }

          this.logger.log(
            `Équipe chauffeur "${driverTeam.name.trim()}" (id=${driverTeam.id}): ${memberIds.length} membres`,
          );
        }

        this.logger.log(
          `Total: ${driverTeams.length} équipes chauffeur trouvées, ${driverEmployeeIds.size} conducteurs uniques`,
        );
      } else {
        // Fallback: if no driver team found, sync all employees (backwards-compatible)
        this.logger.warn(
          `Aucune équipe contenant "${DRIVER_TEAM_KEYWORD}" trouvée — synchronisation de tous les employés en fallback`,
        );
        driverEmployeeIds = new Set(employees.map((e) => e.id));
      }

      // Filter employees to drivers only
      const driverEmployees = employees.filter((e) =>
        driverEmployeeIds.has(e.id),
      );
      this.logger.log(`${driverEmployees.length} conducteurs à synchroniser`);

      // ── Step 3 : Build custom field lookup structures ──
      const slugFieldMap = this.buildCustomFieldSlugMap(customFields);
      const optionLabelMap = this.buildOptionLabelMap(customFieldOptions);

      // Log which slugs were resolved — DETAILED
      const resolvedSlugs = [...slugFieldMap.keys()];
      const missingSlugs = Object.keys(CUSTOM_FIELD_SLUG_MAP).filter(
        (s) => !slugFieldMap.has(s),
      );
      this.logger.log(
        `Custom fields résolus (${resolvedSlugs.length}/${Object.keys(CUSTOM_FIELD_SLUG_MAP).length}): [${resolvedSlugs.join(', ')}]`,
      );
      // Log resolved field details
      for (const [slug, field] of slugFieldMap.entries()) {
        this.logger.log(
          `  Résolu: "${slug}" -> field_id=${field.id}, label="${field.label}", type=${field.field_type}`,
        );
      }
      if (missingSlugs.length > 0) {
        this.logger.warn(
          `Custom fields NON résolus (${missingSlugs.length}): [${missingSlugs.join(', ')}]`,
        );
      }

      // Log sample custom field values to understand the data structure
      if (customFieldValues.length > 0) {
        const sample = customFieldValues.slice(0, 5);
        for (const v of sample) {
          this.logger.log(
            `CFV sample: id=${v.id} field_id=${v.field_id} employee_id=${v.employee_id} valuable_id=${v.valuable_id} valuable_type=${v.valuable_type} value="${v.value}" date_value="${v.date_value}" single_choice="${v.single_choice_value}" option_id=${v.option_id}`,
          );
        }
        // Count employee vs document values
        const employeeValues = customFieldValues.filter(
          (v) => !v.valuable_type || v.valuable_type === 'Employee',
        );
        this.logger.log(
          `Custom field values: ${customFieldValues.length} total, ${employeeValues.length} Employee-type`,
        );
      } else {
        this.logger.warn('AUCUNE valeur de champ personnalisé récupérée !');
      }

      // Log custom field options
      if (customFieldOptions.length > 0) {
        this.logger.log(`Options trouvées (${customFieldOptions.length}): ${customFieldOptions.slice(0, 10).map(o => `id=${o.id} field_id=${o.field_id} label="${o.label}"`).join(', ')}`);
      } else {
        this.logger.warn('AUCUNE option de champ personnalisé récupérée !');
      }

      // ── Step 4 : Fetch today's leaves for availability ──
      const today = new Date().toISOString().split('T')[0];
      let todayLeaves: FactorialLeave[] = [];
      try {
        todayLeaves = await this.factorialService.getLeaves(today, today);
        this.logger.log(`${todayLeaves.length} congés actifs aujourd'hui`);
      } catch (err: any) {
        this.logger.warn(
          `Impossible de récupérer les congés: ${err?.message || err}`,
        );
      }

      // Build a set of employee IDs who are on leave today (approved only)
      const onLeaveMap = new Map<number, string>(); // employee_id -> leave_type_name
      for (const leave of todayLeaves) {
        if (leave.approved !== false) {
          onLeaveMap.set(
            leave.employee_id,
            leave.leave_type_name || 'Absence',
          );
        }
      }

      // ── Step 5 : Process each driver ──
      let created = 0;
      let updated = 0;
      let isFirstDriver = true;

      for (const employee of driverEmployees) {
        // Use the pre-built driver team map (more accurate than findTeamForEmployee)
        const teamInfo = employeeDriverTeamMap.get(employee.id) || this.findTeamForEmployee(employee.id, teams);

        // Resolve all custom fields for this employee
        const cf = this.resolveCustomFields(
          employee.id,
          slugFieldMap,
          customFieldValues,
          optionLabelMap,
          contractToEmployeeMap,
          customResourceToEmployeeMap,
        );

        // Log FULL details for the first driver to help debug
        if (isFirstDriver) {
          this.logger.log(`=== PREMIER CONDUCTEUR: ${employee.first_name} ${employee.last_name} (id=${employee.id}) ===`);
          this.logger.log(`  Email: ${employee.email}, Phone: ${employee.phone_number}`);
          this.logger.log(`  Address: ${employee.address_line_1}, City: ${employee.city}, Country: ${employee.country}`);
          this.logger.log(`  Team: ${teamInfo?.teamName || 'N/A'} (id=${teamInfo?.teamId || 'N/A'})`);
          // Log all resolved custom field values
          for (const [key, val] of Object.entries(cf)) {
            this.logger.log(`  CF "${key}" = "${val}"`);
          }
          // Log how many custom field values this employee has (including contract + custom resource)
          const empCFVs = customFieldValues.filter(v => {
            let empId: number | undefined;
            const vid = v.valuable_id ?? v.employee_id;
            if (!v.valuable_type || v.valuable_type === 'Employee') {
              empId = vid;
            } else if (v.valuable_type === 'Contracts::ContractVersion') {
              empId = vid ? contractToEmployeeMap.get(vid) : undefined;
            } else if (v.valuable_type === 'CustomResources::Value') {
              empId = vid ? customResourceToEmployeeMap.get(vid) : undefined;
            }
            return empId === employee.id;
          });
          this.logger.log(`  Total custom field values for this employee (all types): ${empCFVs.length}`);
          for (const v of empCFVs) {
            this.logger.log(`    field_id=${v.field_id} type=${v.valuable_type} value="${v.value}" date_value="${v.date_value}" single_choice="${v.single_choice_value}"`);
          }
          isFirstDriver = false;
        }

        // Availability from leaves
        const isOnLeave = onLeaveMap.has(employee.id);

        const result = await this.driversCacheService.upsertFromApi({
          factorial_id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          login_email: employee.login_email,
          phone: employee.phone_number,
          address: this.buildAddress(employee),
          address_line_2: employee.address_line_2,
          postal_code: employee.postal_code,
          city: employee.city,
          state: employee.state,
          country: employee.country,
          birthday: employee.birthday_on,
          team_id: teamInfo?.teamId,
          team_name: teamInfo?.teamName,
          // Custom fields
          shift: cf['shift'],
          available_weekends: cf['forfait_weekend'] || cf['shift'],
          forfait_weekend: cf['forfait_weekend'],
          lieu_prise_poste: cf['lieu_prise_poste'],
          numero_carte_as24: cf['numero_carte_as24'],
          date_remise_carte_as24: cf['date_remise_carte_as24'],
          date_restitution_as24: cf['date_restitution_as24'],
          permis_de_conduire: cf['permis_de_conduire'],
          fco: cf['fco'],
          adr: cf['adr'],
          habilitation: cf['habilitation'],
          formation_11239_11262: cf['formation_11239_11262'],
          visite_medicale: cf['visite_medicale'],
          // Availability
          status_from_leaves: isOnLeave ? 'indisponible' : undefined,
          indisponibilite_raison_from_leaves: isOnLeave
            ? onLeaveMap.get(employee.id)
            : undefined,
        });

        if (result.created) created++;
        if (result.updated) updated++;
      }

      // ── Step 6 : Clean up drivers no longer in the team ──
      const syncedFactorialIds = driverEmployees.map((e) => e.id);
      const deletedCount = await this.driversCacheService.deleteNotInFactorialIds(syncedFactorialIds);
      if (deletedCount > 0) {
        this.logger.log(`Nettoyage: ${deletedCount} conducteurs hors équipe supprimés du cache`);
      }

      const duration = Date.now() - startTime;

      await this.updateSyncRecord(syncId, {
        status: 'completed',
        records_synced: driverEmployees.length,
        records_created: created,
        records_updated: updated,
      });

      this.logger.log(
        `Synchronisation conducteurs terminée: ${created} créés, ${updated} mis à jour, ${deletedCount} supprimés (${duration}ms)`,
      );

      return {
        entityType: 'drivers',
        status: 'completed',
        recordsSynced: driverEmployees.length,
        recordsCreated: created,
        recordsUpdated: updated,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.updateSyncRecord(syncId, {
        status: 'failed',
        error_message: errorMessage,
      });

      this.logger.error('Erreur synchronisation conducteurs', error);
      throw new BadRequestException(
        `Erreur synchronisation: ${errorMessage}`,
      );
    }
  }

  /**
   * Sync vehicles from MyRentCar API to cache
   */
  async syncVehicles(triggeredBy?: string): Promise<SyncResultDto> {
    const startTime = Date.now();
    const syncId = await this.createSyncRecord('vehicles', triggeredBy);

    try {
      this.logger.log(
        'Démarrage synchronisation des véhicules depuis MyRentCar...',
      );

      // Fetch all vehicles from MyRentCar
      const vehicles = await this.myRentACarService.getAllVehicleDetails();

      this.logger.log(`MyRentCar: ${vehicles.length} véhicules récupérés`);

      let created = 0;
      let updated = 0;

      // Process each vehicle
      for (const vehicle of vehicles) {
        const result = await this.vehiclesCacheService.upsertFromApi({
          myrentcar_id: vehicle.ID,
          numero: vehicle.Numero,
          immatriculation: vehicle.Immat1,
          type: vehicle.TypeVehicule?.Intitule,
          type_code: vehicle.TypeVehicule?.Code,
          marque_modele: vehicle.MarqueType,
          energie: vehicle.Carburant?.Intitule,
          energie_id: vehicle.Carburant?.ID,
          kilometrage: vehicle.DernierKm,
          date_dernier_km: vehicle.DateDernierKm,
          date_mise_circulation: vehicle.DateMiseCirculation,
          capacite_reservoir: vehicle.CapaciteReservoir,
          poids_vide: vehicle.PoidsVide,
          poids_charge: vehicle.PoidsCharge,
          prime_volume: vehicle.PrimeVolume,
          agence_proprietaire: vehicle.AgenceProprietaire,
          category_code: vehicle.Categorie?.Code,
        });

        if (result.created) created++;
        if (result.updated) updated++;
      }

      const duration = Date.now() - startTime;

      await this.updateSyncRecord(syncId, {
        status: 'completed',
        records_synced: vehicles.length,
        records_created: created,
        records_updated: updated,
      });

      this.logger.log(
        `Synchronisation véhicules terminée: ${created} créés, ${updated} mis à jour (${duration}ms)`,
      );

      return {
        entityType: 'vehicles',
        status: 'completed',
        recordsSynced: vehicles.length,
        recordsCreated: created,
        recordsUpdated: updated,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.updateSyncRecord(syncId, {
        status: 'failed',
        error_message: errorMessage,
      });

      this.logger.error('Erreur synchronisation véhicules', error);
      throw new BadRequestException(
        `Erreur synchronisation: ${errorMessage}`,
      );
    }
  }

  /**
   * Sync both drivers and vehicles
   */
  async syncAll(
    triggeredBy?: string,
  ): Promise<{
    drivers: SyncResultDto;
    vehicles: SyncResultDto;
  }> {
    const [driversResult, vehiclesResult] = await Promise.all([
      this.syncDrivers(triggeredBy),
      this.syncVehicles(triggeredBy),
    ]);

    return {
      drivers: driversResult,
      vehicles: vehiclesResult,
    };
  }

  /**
   * Import vehicles and absences from Wincpl XML files
   */
  async importWincplXml(xmlContents: string[]): Promise<WincplImportResult> {
    this.logger.log(
      `Démarrage import Wincpl: ${xmlContents.length} fichier(s) XML`,
    );

    const parseResult = this.wincplXmlParser.parseMultiple(xmlContents);

    this.logger.log(
      `Wincpl parsed: ${parseResult.vehicles.length} véhicules, ${parseResult.absences.length} absences, ${parseResult.errors.length} erreurs`,
    );

    const result: WincplImportResult = {
      filesProcessed: xmlContents.length,
      vehiclesImported: 0,
      vehiclesUpdated: 0,
      absencesImported: 0,
      errors: [...parseResult.errors],
    };

    // Import vehicles
    for (const vehicle of parseResult.vehicles) {
      try {
        const { created, updated } =
          await this.vehiclesCacheService.upsertFromWincpl(vehicle);
        if (created) result.vehiclesImported++;
        if (updated) result.vehiclesUpdated++;
      } catch (err: any) {
        const msg = `Erreur import véhicule ${vehicle.codeVehicule}: ${err.message || err}`;
        this.logger.error(msg);
        result.errors.push(msg);
      }
    }

    // Import absences
    for (const absence of parseResult.absences) {
      try {
        const ok = await this.vehiclesCacheService.upsertAbsence(absence);
        if (ok) result.absencesImported++;
      } catch (err: any) {
        const msg = `Erreur import absence ${absence.codeLien}: ${err.message || err}`;
        this.logger.error(msg);
        result.errors.push(msg);
      }
    }

    this.logger.log(
      `Import Wincpl terminé: ${result.vehiclesImported} créés, ${result.vehiclesUpdated} mis à jour, ${result.absencesImported} absences`,
    );

    return result;
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatusDto> {
    const status: SyncStatusDto = {};

    // Get last driver sync
    const { data: driverSync } = await this.supabase
      .from('sync_status')
      .select('*')
      .eq('entity_type', 'drivers')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (driverSync) {
      const driverCount = await this.driversCacheService.getCount();
      status.drivers = {
        lastSyncAt: driverSync.completed_at,
        lastSyncStatus: driverSync.status,
        recordsCount: driverCount,
      };
    }

    // Get last vehicle sync
    const { data: vehicleSync } = await this.supabase
      .from('sync_status')
      .select('*')
      .eq('entity_type', 'vehicles')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (vehicleSync) {
      const vehicleCount = await this.vehiclesCacheService.getCount();
      status.vehicles = {
        lastSyncAt: vehicleSync.completed_at,
        lastSyncStatus: vehicleSync.status,
        recordsCount: vehicleCount,
      };
    }

    // Check for in-progress sync
    const { data: inProgressSync } = await this.supabase
      .from('sync_status')
      .select('*')
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (inProgressSync) {
      status.currentSync = {
        entityType: inProgressSync.entity_type,
        status: inProgressSync.status,
        startedAt: inProgressSync.started_at,
        recordsSynced: inProgressSync.records_synced || 0,
      };
    }

    return status;
  }

  /**
   * Get sync history
   */
  async getHistory(limit = 10): Promise<SyncHistoryEntryDto[]> {
    const { data, error } = await this.supabase
      .from('sync_status')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Erreur récupération historique sync', error);
      throw new BadRequestException(error.message);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      entityType: row.entity_type,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      recordsSynced: row.records_synced || 0,
      recordsCreated: row.records_created || 0,
      recordsUpdated: row.records_updated || 0,
      errorMessage: row.error_message,
      triggeredBy: row.triggered_by,
    }));
  }
}
