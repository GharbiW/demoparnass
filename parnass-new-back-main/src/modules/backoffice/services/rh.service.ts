import { Injectable, Logger } from '@nestjs/common';
import { FactorialService } from './factorial.service';
import { DriversCacheService } from './drivers-cache.service';
import {
  FactorialLeave,
  FactorialTraining,
  FactorialTrainingMembership,
  FactorialEmployee,
} from '../types/factorial.types';

// ============================================
// RH Response DTOs
// ============================================

export interface AbsenceDto {
  id: string;
  conducteur: {
    id: string;
    factorialId: number;
    nom: string;
    avatar: string;
  };
  type: 'conges' | 'maladie' | 'formation' | 'autre';
  typeLabel: string;
  dateDebut: string;
  dateFin: string;
  jours: number;
  status: 'en_cours' | 'a_venir' | 'termine';
  approved: boolean;
  description?: string;
}

export interface FormationDto {
  id: string;
  conducteur: {
    id: string;
    factorialId: number;
    nom: string;
    avatar: string;
  };
  formation: string;
  description?: string;
  date: string;
  dateFin?: string;
  duree: string;
  status: string;
}

export interface DocumentAlertDto {
  id: string;
  conducteur: {
    id: string;
    nom: string;
    avatar: string;
  };
  document: string;
  expiration: string;
  joursRestants: number;
  urgence: 'critique' | 'attention' | 'ok';
}

export interface RHStatsDto {
  absencesEnCours: number;
  absencesAVenir: number;
  formationsCeMois: number;
  documentsUrgents: number;
  lastSyncAt?: string;
}

@Injectable()
export class RHService {
  private readonly logger = new Logger(RHService.name);

  constructor(
    private readonly factorialService: FactorialService,
    private readonly driversCacheService: DriversCacheService,
  ) {}

  /**
   * Génère les initiales à partir d'un nom complet
   */
  private getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  /**
   * Détermine le type d'absence basé sur le nom du type de congé
   */
  private getAbsenceType(
    leaveTypeName?: string,
  ): { type: AbsenceDto['type']; typeLabel: string } {
    const name = (leaveTypeName || '').toLowerCase();

    if (
      name.includes('maladie') ||
      name.includes('sick') ||
      name.includes('medical')
    ) {
      return { type: 'maladie', typeLabel: 'Arrêt maladie' };
    }
    if (name.includes('formation') || name.includes('training')) {
      return { type: 'formation', typeLabel: 'Formation' };
    }
    if (name.includes('rtt')) {
      return { type: 'conges', typeLabel: 'RTT' };
    }
    if (
      name.includes('congé') ||
      name.includes('conge') ||
      name.includes('vacances') ||
      name.includes('holiday') ||
      name.includes('paid')
    ) {
      return { type: 'conges', typeLabel: 'Congés payés' };
    }

    return { type: 'autre', typeLabel: leaveTypeName || 'Absence' };
  }

  /**
   * Calcule le nombre de jours entre deux dates
   */
  private calculateDays(startDate: string, endDate?: string): number {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
  }

  /**
   * Détermine le statut d'une absence
   */
  private getAbsenceStatus(
    startDate: string,
    endDate?: string,
  ): AbsenceDto['status'] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (end < today) {
      return 'termine';
    }
    if (start <= today && end >= today) {
      return 'en_cours';
    }
    return 'a_venir';
  }

  /**
   * Récupère les absences depuis Factorial
   */
  async getAbsences(from?: string, to?: string): Promise<AbsenceDto[]> {
    // Default to current month + next month
    const now = new Date();
    const defaultFrom =
      from || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const defaultTo =
      to || new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];

    this.logger.log(`Récupération absences du ${defaultFrom} au ${defaultTo}`);

    try {
      // Fetch leaves and employees in parallel
      const [leaves, employees] = await Promise.all([
        this.factorialService.getLeaves(defaultFrom, defaultTo),
        this.factorialService.getAllEmployees(),
      ]);

      // Create employee lookup map
      const employeeMap = new Map<number, FactorialEmployee>();
      employees.forEach((emp) => employeeMap.set(emp.id, emp));

      // Transform leaves to absences
      const absences: AbsenceDto[] = leaves
        .map((leave) => {
          const employee = employeeMap.get(leave.employee_id);
          if (!employee) return null;

          const { type, typeLabel } = this.getAbsenceType(leave.leave_type_name);
          const status = this.getAbsenceStatus(leave.start_on, leave.finish_on);

          // Skip finished absences unless explicitly requested
          if (status === 'termine' && !from) return null;

          return {
            id: `factorial-leave-${leave.id}`,
            conducteur: {
              id: `factorial-${employee.id}`,
              factorialId: employee.id,
              nom: `${employee.first_name} ${employee.last_name}`,
              avatar: this.getInitials(employee.first_name, employee.last_name),
            },
            type,
            typeLabel,
            dateDebut: leave.start_on,
            dateFin: leave.finish_on || leave.start_on,
            jours: this.calculateDays(leave.start_on, leave.finish_on),
            status,
            approved: leave.approved ?? false,
            description: leave.description,
          } as AbsenceDto;
        })
        .filter((a): a is AbsenceDto => a !== null);

      // Sort by start date (most recent first for en_cours, soonest first for a_venir)
      absences.sort((a, b) => {
        if (a.status === 'en_cours' && b.status !== 'en_cours') return -1;
        if (b.status === 'en_cours' && a.status !== 'en_cours') return 1;
        return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
      });

      this.logger.log(`${absences.length} absences trouvées`);
      return absences;
    } catch (error) {
      this.logger.error(`Erreur récupération absences: ${error}`);
      throw error;
    }
  }

  /**
   * Récupère les formations depuis Factorial
   */
  async getFormations(): Promise<FormationDto[]> {
    this.logger.log('Récupération formations depuis Factorial...');

    try {
      // Fetch trainings - handle potential 404 or empty module
      let trainings: FactorialTraining[] = [];
      let memberships: FactorialTrainingMembership[] = [];
      let employees: FactorialEmployee[] = [];

      try {
        trainings = await this.factorialService.getTrainings();
        this.logger.log(`Factorial: ${trainings.length} formations brutes récupérées`);
      } catch (err: any) {
        this.logger.warn(`Module formations Factorial non disponible ou vide: ${err?.message || err}`);
        trainings = [];
      }

      try {
        memberships = await this.factorialService.getTrainingMemberships();
        this.logger.log(`Factorial: ${memberships.length} inscriptions formations récupérées`);
      } catch (err: any) {
        this.logger.warn(`Inscriptions formations non disponibles: ${err?.message || err}`);
        memberships = [];
      }

      try {
        employees = await this.factorialService.getAllEmployees();
      } catch (err: any) {
        this.logger.warn(`Employés non disponibles: ${err?.message || err}`);
        employees = [];
      }

      // If no trainings found, return empty array
      if (trainings.length === 0) {
        this.logger.log('Aucune formation trouvée dans Factorial (module peut-être non activé ou vide)');
        return [];
      }

      // Debug: Log first training, membership and employee to understand structure
      if (trainings.length > 0) {
        this.logger.debug(`Premier training brut: ${JSON.stringify(trainings[0])}`);
      }
      if (memberships.length > 0) {
        this.logger.debug(`Premier membership brut: ${JSON.stringify(memberships[0])}`);
      }
      if (employees.length > 0) {
        this.logger.debug(`Premier employee brut: ${JSON.stringify(employees[0])}`);
      }

      // Create employee lookup maps (by both id and access_id)
      const employeeMap = new Map<number, FactorialEmployee>();
      const employeeByAccessId = new Map<number, FactorialEmployee>();
      employees.forEach((emp) => {
        employeeMap.set(emp.id, emp);
        // Also map by access_id if available
        if ((emp as any).access_id) {
          employeeByAccessId.set((emp as any).access_id, emp);
        }
      });
      this.logger.debug(`Employee map créé avec ${employeeMap.size} employés, ${employeeByAccessId.size} avec access_id`);

      // Group memberships by training
      const trainingMemberships = new Map<number, FactorialTrainingMembership[]>();
      memberships.forEach((m) => {
        const existing = trainingMemberships.get(m.training_id) || [];
        existing.push(m);
        trainingMemberships.set(m.training_id, existing);
      });
      this.logger.debug(`Training memberships groupés: ${trainingMemberships.size} trainings avec participants`);

      // Transform trainings with participants
      const formations: FormationDto[] = [];

      for (const training of trainings) {
        // Try both 'id' and possible alternative id fields
        const trainingId = (training as any).id;
        const participants = trainingMemberships.get(trainingId) || [];
        this.logger.debug(`Training "${(training as any).name || training.name}" (id=${trainingId}): ${participants.length} participants`);

        // Create a formation entry for each participant
        for (const participant of participants) {
          // Try to find employee by access_id (Factorial uses access_id in memberships, not employee_id)
          const accessId = participant.access_id;
          const employeeId = participant.employee_id;
          
          let employee = employeeByAccessId.get(accessId) || (employeeId ? employeeMap.get(employeeId) : undefined);
          
          if (!employee) {
            this.logger.debug(`Participant non trouvé: access_id=${accessId}, employee_id=${employeeId}`);
            continue;
          }

          // Calculate duration
          let duree = '—';
          if (training.duration_hours) {
            const hours = training.duration_hours;
            if (hours >= 8) {
              duree = `${Math.round(hours / 8)} jour${hours >= 16 ? 's' : ''}`;
            } else {
              duree = `${hours}h`;
            }
          } else if (training.start_date && training.end_date) {
            const days = this.calculateDays(training.start_date, training.end_date);
            duree = `${days} jour${days > 1 ? 's' : ''}`;
          }

          formations.push({
            id: `factorial-training-${training.id}-${participant.access_id || participant.id}`,
            conducteur: {
              id: `factorial-${employee.id}`,
              factorialId: employee.id,
              nom: `${employee.first_name} ${employee.last_name}`,
              avatar: this.getInitials(employee.first_name, employee.last_name),
            },
            formation: training.name,
            description: training.description,
            date: training.start_date || new Date().toISOString().split('T')[0],
            dateFin: training.end_date,
            duree,
            status: participant.status || training.status || 'planned',
          });
        }

        // If no participants, still show the training (might be open enrollment)
        if (participants.length === 0 && training.start_date) {
          let duree = '—';
          if (training.duration_hours) {
            const hours = training.duration_hours;
            if (hours >= 8) {
              duree = `${Math.round(hours / 8)} jour${hours >= 16 ? 's' : ''}`;
            } else {
              duree = `${hours}h`;
            }
          }

          formations.push({
            id: `factorial-training-${training.id}`,
            conducteur: {
              id: '',
              factorialId: 0,
              nom: 'Non assigné',
              avatar: '—',
            },
            formation: training.name,
            description: training.description,
            date: training.start_date,
            dateFin: training.end_date,
            duree,
            status: training.status || 'planned',
          });
        }
      }

      // Sort by date
      formations.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      this.logger.log(`${formations.length} formations transformées`);
      return formations;
    } catch (error) {
      this.logger.error(`Erreur récupération formations: ${error}`);
      // Return empty array instead of throwing to not break the page
      return [];
    }
  }

  /**
   * Récupère les alertes de documents depuis les champs personnalisés Factorial
   * Factorial n'a pas d'API dédiée pour les documents RH, mais on peut utiliser les custom fields
   */
  async getDocumentAlerts(): Promise<DocumentAlertDto[]> {
    this.logger.log('Récupération alertes documents depuis Factorial...');

    try {
      // Also try to fetch Factorial documents module
      try {
        const factorialDocs = await this.factorialService.getDocuments();
        if (factorialDocs.length > 0) {
          this.logger.log(`Factorial Documents: ${factorialDocs.length} documents trouvés`);
          this.logger.debug(`Premier document Factorial: ${JSON.stringify(factorialDocs[0])}`);
        }
      } catch (err: any) {
        this.logger.debug(`Documents Factorial non disponibles: ${err?.message || err}`);
      }

      // Fetch custom fields and values
      const [fields, values, employees] = await Promise.all([
        this.factorialService.getCustomFields(),
        this.factorialService.getCustomFieldValues(),
        this.factorialService.getAllEmployees(),
      ]);

      this.logger.log(`Factorial: ${fields.length} custom fields, ${values.length} valeurs`);

      // Debug: Log first custom field to see actual structure
      if (fields.length > 0) {
        this.logger.debug(`Premier custom field brut: ${JSON.stringify(fields[0])}`);
      }

      // Log available custom field labels to help identify document fields
      // Factorial might use 'name' instead of 'label'
      const fieldLabels = fields.map(f => (f as any).name || f.label || '');
      this.logger.debug(`Custom fields disponibles: ${fieldLabels.slice(0, 20).join(', ')}${fieldLabels.length > 20 ? '...' : ''}`);

      // Find document-related fields (look for date fields with document-related names)
      const documentFieldKeywords = [
        'visite', 'medical', 'médicale', 'medicale',
        'permis', 'license', 'licence',
        'adr', 'fimo', 'fcos', 'caces',
        'carte', 'card', 'conducteur',
        'expiration', 'validite', 'validité', 'expire', 'fin',
        'certification', 'certificat', 'attestation',
        'habilitation',
      ];

      const documentFields = fields.filter(f => {
        // Check both 'label' and 'name' properties (Factorial API might use either)
        const fieldName = ((f as any).name || f.label || '').toLowerCase();
        return documentFieldKeywords.some(kw => fieldName.includes(kw));
      });

      const documentFieldNames = documentFields.map(f => (f as any).name || f.label || 'unknown');
      this.logger.log(`${documentFields.length} champs documents trouvés: ${documentFieldNames.join(', ')}`);

      if (documentFields.length === 0) {
        this.logger.warn('Aucun champ personnalisé de type document trouvé dans Factorial');
        this.logger.warn('Pour activer les alertes documents, créez des champs personnalisés avec des noms contenant: visite, permis, adr, fimo, carte, expiration, etc.');
        return [];
      }

      // Create lookup maps
      const employeeMap = new Map<number, FactorialEmployee>();
      employees.forEach(emp => employeeMap.set(emp.id, emp));

      const fieldMap = new Map<number, string>();
      documentFields.forEach(f => fieldMap.set(f.id, (f as any).name || f.label || 'unknown'));

      // Process document values
      const alerts: DocumentAlertDto[] = [];
      const today = new Date();

      for (const value of values) {
        const fieldLabel = fieldMap.get(value.field_id);
        if (!fieldLabel) continue; // Not a document field

        const empId = value.employee_id ?? value.valuable_id;
        if (!empId) continue;
        const employee = employeeMap.get(empId);
        if (!employee) continue;

        // Try to parse the value as a date
        const dateValue = this.parseDate(value.value);
        if (!dateValue) continue;

        // Calculate days remaining
        const joursRestants = Math.ceil((dateValue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Determine urgency
        let urgence: DocumentAlertDto['urgence'];
        if (joursRestants <= 7) {
          urgence = 'critique';
        } else if (joursRestants <= 30) {
          urgence = 'attention';
        } else {
          urgence = 'ok';
        }

        alerts.push({
          id: `factorial-doc-${value.id}`,
          conducteur: {
            id: `factorial-${employee.id}`,
            nom: `${employee.first_name} ${employee.last_name}`,
            avatar: this.getInitials(employee.first_name, employee.last_name),
          },
          document: fieldLabel,
          expiration: dateValue.toISOString().split('T')[0],
          joursRestants,
          urgence,
        });
      }

      // Sort by urgency then days remaining
      alerts.sort((a, b) => {
        const urgencyOrder = { critique: 0, attention: 1, ok: 2 };
        if (urgencyOrder[a.urgence] !== urgencyOrder[b.urgence]) {
          return urgencyOrder[a.urgence] - urgencyOrder[b.urgence];
        }
        return a.joursRestants - b.joursRestants;
      });

      this.logger.log(`${alerts.length} alertes documents générées`);
      return alerts;
    } catch (error) {
      this.logger.error(`Erreur récupération alertes documents: ${error}`);
      return [];
    }
  }

  /**
   * Parse une valeur en date (supporte plusieurs formats)
   */
  private parseDate(value: string): Date | null {
    if (!value) return null;
    
    // Try ISO format first
    let date = new Date(value);
    if (!isNaN(date.getTime())) return date;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      date = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try YYYY-MM-DD format
    const yyyymmdd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
      date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
      if (!isNaN(date.getTime())) return date;
    }
    
    return null;
  }

  /**
   * Récupère les statistiques RH
   */
  async getStats(): Promise<RHStatsDto> {
    this.logger.log('Calcul statistiques RH');

    try {
      const absences = await this.getAbsences();
      const formations = await this.getFormations();
      const documents = await this.getDocumentAlerts();

      const now = new Date();
      const currentMonth = now.getMonth();

      // Filter formations for current month
      const formationsCeMois = formations.filter((f) => {
        const formationDate = new Date(f.date);
        return formationDate.getMonth() === currentMonth;
      });

      return {
        absencesEnCours: absences.filter((a) => a.status === 'en_cours').length,
        absencesAVenir: absences.filter((a) => a.status === 'a_venir').length,
        formationsCeMois: formationsCeMois.length,
        documentsUrgents: documents.filter((d) => d.urgence === 'critique').length,
        lastSyncAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Erreur calcul statistiques RH: ${error}`);
      throw error;
    }
  }
}
