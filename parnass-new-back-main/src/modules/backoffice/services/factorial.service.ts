import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  FactorialEmployee,
  FactorialTeam,
  FactorialMembership,
  FactorialLeave,
  FactorialCustomField,
  FactorialCustomFieldValue,
  FactorialCustomFieldOption,
  FactorialOpenShift,
  FactorialPaginatedResponse,
  FactorialTraining,
  FactorialTrainingMembership,
  FactorialContractVersion,
  FactorialAttendanceShift,
  FactorialLeaveType,
  FactorialDocument,
  FactorialFolder,
} from '../types/factorial.types';

@Injectable()
export class FactorialService {
  private readonly logger = new Logger(FactorialService.name);
  private readonly baseUrl =
    'https://api.factorialhr.com/api/2026-01-01/resources';
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('FACTORIAL_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn(
        'FACTORIAL_API_KEY non configurée - les appels API Factorial seront désactivés',
      );
    }
  }

  private get headers() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
  }

  /**
   * Récupère tous les employés actifs avec pagination
   */
  async getAllEmployees(): Promise<FactorialEmployee[]> {
    if (!this.apiKey) return [];

    const employees: FactorialEmployee[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<FactorialPaginatedResponse<FactorialEmployee>>(
            `${this.baseUrl}/employees/employees`,
            {
              headers: this.headers,
              params: {
                limit: 100,
                page,
                only_managers: false,
                only_active: true,
              },
            },
          ),
        );

        employees.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;

        this.logger.debug(
          `Factorial: Page ${page - 1} récupérée, ${response.data.data.length} employés`,
        );
      } catch (error) {
        this.logger.error(`Erreur récupération employés Factorial: ${error}`);
        throw error;
      }
    }

    this.logger.log(
      `Factorial: ${employees.length} employés récupérés au total`,
    );
    return employees;
  }

  /**
   * Récupère toutes les équipes
   */
  async getAllTeams(): Promise<FactorialTeam[]> {
    if (!this.apiKey) return [];

    const teams: FactorialTeam[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<FactorialPaginatedResponse<FactorialTeam>>(
            `${this.baseUrl}/teams/teams`,
            {
              headers: this.headers,
              params: { limit: 100, page },
            },
          ),
        );

        teams.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error) {
        this.logger.error(`Erreur récupération équipes Factorial: ${error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${teams.length} équipes récupérées`);
    return teams;
  }

  /**
   * Récupère les congés pour une période donnée
   */
  async getLeaves(from: string, to: string): Promise<FactorialLeave[]> {
    if (!this.apiKey) return [];

    const leaves: FactorialLeave[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<FactorialPaginatedResponse<FactorialLeave>>(
            `${this.baseUrl}/timeoff/leaves`,
            {
              headers: this.headers,
              params: {
                limit: 100,
                page,
                from,
                to,
                include_deleted_leaves: false,
                include_leave_type: true,
              },
            },
          ),
        );

        leaves.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error) {
        this.logger.error(`Erreur récupération congés Factorial: ${error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${leaves.length} congés récupérés`);
    return leaves;
  }

  /**
   * Récupère les champs personnalisés
   */
  async getCustomFields(): Promise<FactorialCustomField[]> {
    if (!this.apiKey) return [];

    const fields: FactorialCustomField[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialCustomField>
          >(`${this.baseUrl}/custom_fields/fields`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        fields.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error) {
        this.logger.error(`Erreur récupération champs personnalisés: ${error}`);
        throw error;
      }
    }

    return fields;
  }

  /**
   * Récupère les valeurs des champs personnalisés
   */
  async getCustomFieldValues(): Promise<FactorialCustomFieldValue[]> {
    if (!this.apiKey) return [];

    const values: FactorialCustomFieldValue[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialCustomFieldValue>
          >(`${this.baseUrl}/custom_fields/values`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        values.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error) {
        this.logger.error(
          `Erreur récupération valeurs personnalisées: ${error}`,
        );
        throw error;
      }
    }

    return values;
  }

  /**
   * Récupère toutes les formations
   * Note: Le module formations peut ne pas être activé sur votre compte Factorial
   */
  async getTrainings(): Promise<FactorialTraining[]> {
    if (!this.apiKey) return [];

    const trainings: FactorialTraining[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<FactorialPaginatedResponse<FactorialTraining>>(
            `${this.baseUrl}/trainings/trainings`,
            {
              headers: this.headers,
              params: { limit: 100, page },
            },
          ),
        );

        trainings.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        // Handle 404 or module not available
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.logger.warn('Module formations Factorial non disponible (404/403) - module peut-être non activé');
          return [];
        }
        this.logger.error(`Erreur récupération formations Factorial: ${error?.message || error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${trainings.length} formations récupérées`);
    return trainings;
  }

  /**
   * Récupère les inscriptions aux formations (qui participe à quelle formation)
   */
  async getTrainingMemberships(): Promise<FactorialTrainingMembership[]> {
    if (!this.apiKey) return [];

    const memberships: FactorialTrainingMembership[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialTrainingMembership>
          >(`${this.baseUrl}/trainings/training_memberships`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        memberships.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        // Handle 404 or module not available
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.logger.warn('Inscriptions formations non disponibles (404/403)');
          return [];
        }
        this.logger.error(`Erreur récupération inscriptions formations: ${error?.message || error}`);
        throw error;
      }
    }

    this.logger.log(
      `Factorial: ${memberships.length} inscriptions formations récupérées`,
    );
    return memberships;
  }

  /**
   * Récupère les versions de contrat (postes, salaires, etc.)
   */
  async getContractVersions(): Promise<FactorialContractVersion[]> {
    if (!this.apiKey) return [];

    const contracts: FactorialContractVersion[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialContractVersion>
          >(`${this.baseUrl}/contracts/contract_versions`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        contracts.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error) {
        this.logger.error(`Erreur récupération contrats Factorial: ${error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${contracts.length} contrats récupérés`);
    return contracts;
  }

  /**
   * Récupère les pointages/shifts pour une période donnée
   */
  async getAttendanceShifts(
    from: string,
    to: string,
  ): Promise<FactorialAttendanceShift[]> {
    if (!this.apiKey) return [];

    const shifts: FactorialAttendanceShift[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialAttendanceShift>
          >(`${this.baseUrl}/attendance/shifts`, {
            headers: this.headers,
            params: {
              limit: 100,
              page,
              'date[gte]': from,
              'date[lte]': to,
            },
          }),
        );

        shifts.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error) {
        this.logger.error(`Erreur récupération pointages Factorial: ${error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${shifts.length} pointages récupérés`);
    return shifts;
  }

  /**
   * Récupère les types de congés
   */
  async getLeaveTypes(): Promise<FactorialLeaveType[]> {
    if (!this.apiKey) return [];

    const types: FactorialLeaveType[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<FactorialPaginatedResponse<FactorialLeaveType>>(
            `${this.baseUrl}/timeoff/leave_types`,
            {
              headers: this.headers,
              params: { limit: 100, page },
            },
          ),
        );

        types.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error) {
        this.logger.error(
          `Erreur récupération types de congés Factorial: ${error}`,
        );
        throw error;
      }
    }

    this.logger.log(`Factorial: ${types.length} types de congés récupérés`);
    return types;
  }

  /**
   * Récupère tous les documents
   */
  async getDocuments(): Promise<FactorialDocument[]> {
    if (!this.apiKey) return [];

    const documents: FactorialDocument[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<FactorialPaginatedResponse<FactorialDocument>>(
            `${this.baseUrl}/documents/documents`,
            {
              headers: this.headers,
              params: { limit: 100, page },
            },
          ),
        );

        documents.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.logger.warn('Module documents Factorial non disponible (404/403)');
          return [];
        }
        this.logger.error(`Erreur récupération documents Factorial: ${error?.message || error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${documents.length} documents récupérés`);
    return documents;
  }

  /**
   * Récupère tous les dossiers de documents
   */
  async getDocumentFolders(): Promise<FactorialFolder[]> {
    if (!this.apiKey) return [];

    const folders: FactorialFolder[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<FactorialPaginatedResponse<FactorialFolder>>(
            `${this.baseUrl}/documents/folders`,
            {
              headers: this.headers,
              params: { limit: 100, page },
            },
          ),
        );

        folders.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.logger.warn('Module dossiers documents Factorial non disponible');
          return [];
        }
        this.logger.error(`Erreur récupération dossiers Factorial: ${error?.message || error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${folders.length} dossiers récupérés`);
    return folders;
  }

  /**
   * Récupère toutes les memberships d'équipes (association team_id <-> employee_id)
   */
  async getTeamMemberships(): Promise<FactorialMembership[]> {
    if (!this.apiKey) return [];

    const memberships: FactorialMembership[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialMembership>
          >(`${this.baseUrl}/teams/memberships`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        memberships.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.logger.warn('Team memberships API non disponible (404/403)');
          return [];
        }
        this.logger.error(`Erreur récupération memberships: ${error?.message || error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${memberships.length} team memberships récupérées`);
    return memberships;
  }

  /**
   * Récupère les options des champs personnalisés (pour les single_choice)
   */
  async getCustomFieldOptions(): Promise<FactorialCustomFieldOption[]> {
    if (!this.apiKey) return [];

    const options: FactorialCustomFieldOption[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialCustomFieldOption>
          >(`${this.baseUrl}/custom_fields/options`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        options.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.logger.warn('Custom field options API non disponible (404/403)');
          return [];
        }
        this.logger.error(`Erreur récupération options champs personnalisés: ${error?.message || error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${options.length} options champs personnalisés récupérées`);
    return options;
  }

  /**
   * Récupère toutes les valeurs de ressources personnalisées (custom resources values)
   * Nécessaire pour mapper valuable_id → employee (attachable_id) pour les champs
   * de type CustomResources::Value (ex: permis, FCO, ADR, visite médicale, etc.)
   */
  async getAllCustomResourceValues(): Promise<
    Array<{ id: number; resource_id: number; attachable_id: number }>
  > {
    if (!this.apiKey) return [];

    const values: Array<{
      id: number;
      resource_id: number;
      attachable_id: number;
    }> = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<{
              id: number;
              resource_id: number;
              attachable_id: number;
            }>
          >(`${this.baseUrl}/custom_resources/values`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        values.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 403
        ) {
          this.logger.warn(
            'Custom resources values API non disponible (404/403)',
          );
          return [];
        }
        this.logger.error(
          `Erreur récupération custom resources values: ${error?.message || error}`,
        );
        throw error;
      }
    }

    this.logger.log(
      `Factorial: ${values.length} custom resource values récupérées`,
    );
    return values;
  }

  /**
   * Récupère les open shifts (pointages en cours / clock-in)
   */
  async getOpenShifts(): Promise<FactorialOpenShift[]> {
    if (!this.apiKey) return [];

    const shifts: FactorialOpenShift[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<
            FactorialPaginatedResponse<FactorialOpenShift>
          >(`${this.baseUrl}/attendance/open_shifts`, {
            headers: this.headers,
            params: { limit: 100, page },
          }),
        );

        shifts.push(...response.data.data);
        hasNextPage = response.data.meta.has_next_page;
        page++;
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          this.logger.warn('Open shifts API non disponible (404/403)');
          return [];
        }
        this.logger.error(`Erreur récupération open shifts: ${error?.message || error}`);
        throw error;
      }
    }

    this.logger.log(`Factorial: ${shifts.length} open shifts récupérés`);
    return shifts;
  }
}
