import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  MyRentACarVehicle,
  MyRentACarDetailedVehicle,
  MyRentACarLoginCredentials,
} from '../types/my-rent-a-car.types';

@Injectable()
export class MyRentACarService {
  private readonly logger = new Logger(MyRentACarService.name);
  private readonly baseUrl =
    'https://avi75427.hitech-mysolutions.com/myrentcar/api/MyRentcarServices';
  private readonly credentials: MyRentACarLoginCredentials | null;
  private sessionCookie: string | null = null;
  private readonly chunkSize = 100;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const credentialsJson = this.configService.get<string>(
      'MY_RENT_A_CAR_LOGIN_CREDENTIALS',
    );
    if (credentialsJson) {
      try {
        this.credentials = JSON.parse(credentialsJson);
      } catch {
        this.logger.warn(
          'MY_RENT_A_CAR_LOGIN_CREDENTIALS invalide - les appels API MyRentACar seront désactivés',
        );
        this.credentials = null;
      }
    } else {
      this.logger.warn(
        'MY_RENT_A_CAR_LOGIN_CREDENTIALS non configuré - les appels API MyRentACar seront désactivés',
      );
      this.credentials = null;
    }
  }

  /**
   * Authentification et récupération du cookie de session
   */
  async login(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credentials MyRentACar non configurés');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/Login/Login`, this.credentials, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // Extract session cookie from response
      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        this.sessionCookie = cookies[0].split(';')[0];
        this.logger.log('MyRentACar: Authentification réussie');
      } else {
        throw new Error('Pas de cookie de session dans la réponse');
      }
    } catch (error) {
      this.logger.error(`Erreur authentification MyRentACar: ${error}`);
      throw error;
    }
  }

  /**
   * Exécute une requête avec gestion automatique du re-login sur 401
   */
  private async executeWithAuth<T>(
    requestFn: () => Promise<T>,
    retried = false,
  ): Promise<T> {
    // Login if no session
    if (!this.sessionCookie) {
      await this.login();
    }

    try {
      return await requestFn();
    } catch (error) {
      const axiosError = error as AxiosError;

      // If 401 and not already retried, re-login and retry
      if (axiosError.response?.status === 401 && !retried) {
        this.logger.warn('MyRentACar: Session expirée, re-authentification...');
        this.sessionCookie = null;
        await this.login();
        return this.executeWithAuth(requestFn, true);
      }

      throw error;
    }
  }

  private get authHeaders() {
    return {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie || '',
    };
  }

  /**
   * Récupère tous les IDs de véhicules
   */
  async getVehicleIds(): Promise<number[]> {
    if (!this.credentials) return [];

    return this.executeWithAuth(async () => {
      const response = await firstValueFrom(
        this.httpService.get<MyRentACarVehicle[]>(
          `${this.baseUrl}/Vehicules/GetVehiculesWs`,
          { headers: this.authHeaders },
        ),
      );

      const ids = response.data.map((v) => v.ID);
      this.logger.log(`MyRentACar: ${ids.length} véhicules trouvés`);
      return ids;
    });
  }

  /**
   * Récupère les détails des véhicules par IDs
   */
  async getVehicleDetails(ids: number[]): Promise<MyRentACarDetailedVehicle[]> {
    if (!this.credentials || ids.length === 0) return [];

    return this.executeWithAuth(async () => {
      // Build query params with multiple ids
      const params = new URLSearchParams();
      ids.forEach((id) => params.append('ids', id.toString()));

      const response = await firstValueFrom(
        this.httpService.get<MyRentACarDetailedVehicle[]>(
          `${this.baseUrl}/Vehicules/GetVehiculesDetail`,
          {
            headers: this.authHeaders,
            params,
          },
        ),
      );

      return response.data;
    });
  }

  /**
   * Récupère les détails par chunks de 100
   */
  async getAllVehicleDetails(): Promise<MyRentACarDetailedVehicle[]> {
    if (!this.credentials) return [];

    const allIds = await this.getVehicleIds();
    if (allIds.length === 0) return [];

    const allDetails: MyRentACarDetailedVehicle[] = [];

    // Process in chunks
    for (let i = 0; i < allIds.length; i += this.chunkSize) {
      const chunkIds = allIds.slice(i, i + this.chunkSize);
      this.logger.debug(
        `MyRentACar: Récupération chunk ${Math.floor(i / this.chunkSize) + 1}/${Math.ceil(allIds.length / this.chunkSize)}`,
      );

      const details = await this.getVehicleDetails(chunkIds);
      allDetails.push(...details);
    }

    this.logger.log(
      `MyRentACar: ${allDetails.length} détails véhicules récupérés`,
    );
    return allDetails;
  }

  /**
   * Récupère un véhicule spécifique par son ID MyRentACar
   */
  async getVehicleById(
    myRentACarId: number,
  ): Promise<MyRentACarDetailedVehicle | null> {
    if (!this.credentials) return null;

    const details = await this.getVehicleDetails([myRentACarId]);
    if (details.length === 0) return null;

    return details[0];
  }
}
