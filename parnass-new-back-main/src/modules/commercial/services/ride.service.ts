import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { CreateRideDto, UpdateRideDto } from '../dto/ride';
import { ActivityService, ActivityType, EntityType } from './activity.service';
import { ExcelService } from '../../shared/services/excel.service';
import { ColumnConfig } from '../../shared/dto/import-result.dto';

// Column configuration for Ride export
const RIDE_EXPORT_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Référence',
    field: 'reference',
    required: true,
    type: 'string',
  },
  {
    frenchHeader: 'Réf. trajet client',
    field: 'referenceClient',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Réf. prestation',
    field: 'prestationReference',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Client',
    field: 'clientName',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Adresse départ',
    field: 'adresseDepart',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Ville départ',
    field: 'villeDepart',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Adresse arrivée',
    field: 'adresseArrivee',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Ville arrivée',
    field: 'villeArrivee',
    required: false,
    type: 'string',
  },
  { frenchHeader: 'Date', field: 'date', required: false, type: 'string' },
  {
    frenchHeader: 'H. présence',
    field: 'hPresence',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'H. départ',
    field: 'hDepart',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'H. arrivée',
    field: 'hArrivee',
    required: false,
    type: 'string',
  },
  { frenchHeader: 'H. fin', field: 'hFin', required: false, type: 'string' },
  {
    frenchHeader: 'Durée (min)',
    field: 'duration',
    required: false,
    type: 'number',
  },
  {
    frenchHeader: 'Distance (km)',
    field: 'distanceKm',
    required: false,
    type: 'number',
  },
  { frenchHeader: 'Vide', field: 'vide', required: false, type: 'boolean' },
  { frenchHeader: 'Statut', field: 'statut', required: false, type: 'string' },
  {
    frenchHeader: 'Commentaire',
    field: 'comment',
    required: false,
    type: 'string',
  },
];

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
    private readonly excelService: ExcelService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findAll(prestationId?: string) {
    let query = this.supabase.from('ride').select(`
        *,
        address:address_id (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressDepart:address_depart (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressArrivee:address_arrivee (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        prestation:prestation_id (
          id,
          reference,
          reference_client,
          contract:contract_id (
            id,
            reference,
            reference_client,
            name,
            client:client_id (
              id,
              reference,
              reference_client,
              name,
              initials,
              avatar_url,
              color
            )
          )
        )
      `);

    if (prestationId) {
      query = query.eq('prestation_id', prestationId);
    }

    const { data, error } = await query.order('order_index', {
      ascending: true,
    });

    if (error) {
      this.logger.error('Error fetching rides', error);
      throw new BadRequestException(error.message);
    }

    return data.map((ride: any) => this.transformRide(ride));
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('ride')
      .select(
        `
        *,
        address:address_id (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressDepart:address_depart (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressArrivee:address_arrivee (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        prestation:prestation_id (
          id,
          reference,
          reference_client,
          contract:contract_id (
            id,
            reference,
            reference_client,
            name,
            client:client_id (
              id,
              reference,
              reference_client,
              name,
              initials,
              avatar_url,
              color
            )
          )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Ride with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }

    return this.transformRide(data);
  }

  async findByReference(reference: string) {
    const { data, error } = await this.supabase
      .from('ride')
      .select(
        `
        *,
        address:address_id (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressDepart:address_depart (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressArrivee:address_arrivee (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        prestation:prestation_id (
          id,
          reference,
          reference_client,
          contract:contract_id (
            id,
            reference,
            reference_client,
            name,
            client:client_id (
              id,
              reference,
              reference_client,
              name,
              initials,
              avatar_url,
              color
            )
          )
        )
      `,
      )
      .or(`reference.eq.${reference},reference_client.ilike.%${reference}%`)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error searching rides by reference', error);
      throw new BadRequestException(error.message);
    }

    return data.map((ride: any) => this.transformRide(ride));
  }

  async search(query: string) {
    // Search by reference, reference_client, or address name
    const { data, error } = await this.supabase
      .from('ride')
      .select(
        `
        *,
        address:address_id (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressDepart:address_depart (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressArrivee:address_arrivee (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        prestation:prestation_id (
          id,
          reference,
          reference_client,
          contract:contract_id (
            id,
            reference,
            reference_client,
            name,
            client:client_id (
              id,
              reference,
              reference_client,
              name,
              initials,
              avatar_url,
              color
            )
          )
        )
      `,
      )
      .or(
        `reference.ilike.%${query}%,reference_client.ilike.%${query}%,comment.ilike.%${query}%`,
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error('Error searching rides', error);
      throw new BadRequestException(error.message);
    }

    return data.map((ride: any) => this.transformRide(ride));
  }

  async create(
    createRideDto: CreateRideDto,
    userId?: string,
    userName?: string,
  ) {
    // Verify prestation exists
    const { data: prestation, error: prestationError } = await this.supabase
      .from('prestation')
      .select('id')
      .eq('id', createRideDto.prestationId)
      .single();

    if (prestationError || !prestation) {
      throw new NotFoundException(
        `Prestation with ID ${createRideDto.prestationId} not found`,
      );
    }

    // If no orderIndex provided, get the next available
    let orderIndex = createRideDto.orderIndex;
    if (orderIndex === undefined) {
      const { data: maxOrder } = await this.supabase
        .from('ride')
        .select('order_index')
        .eq('prestation_id', createRideDto.prestationId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      orderIndex = maxOrder ? maxOrder.order_index + 1 : 0;
    }

    const rideData = this.transformDtoToDb(createRideDto);
    rideData.order_index = orderIndex;

    const { data, error } = await this.supabase
      .from('ride')
      .insert(rideData)
      .select(
        `
        *,
        address:address_id (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressDepart:address_depart (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressArrivee:address_arrivee (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error creating ride', error);
      throw new BadRequestException(error.message);
    }

    const ride = this.transformRide(data);

    // Log activity
    await this.activityService.log(
      ActivityType.RIDE_AJOUTE,
      ride.displayReference || ride.reference,
      ride.reference,
      userId,
      userName,
      EntityType.RIDE,
      ride.id,
      { prestationId: createRideDto.prestationId },
    );

    return ride;
  }

  async update(
    id: string,
    updateRideDto: UpdateRideDto,
    userId?: string,
    userName?: string,
  ) {
    // First check if ride exists
    await this.findOne(id);

    const rideData = this.transformDtoToDb(updateRideDto);

    const { data, error } = await this.supabase
      .from('ride')
      .update(rideData)
      .eq('id', id)
      .select(
        `
        *,
        address:address_id (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressDepart:address_depart (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        ),
        addressArrivee:address_arrivee (
          id,
          reference,
          reference_client,
          name,
          address,
          postal_code,
          city,
          country,
          latitude,
          longitude
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error updating ride', error);
      throw new BadRequestException(error.message);
    }

    const ride = this.transformRide(data);

    // Sync prestation-level heure_depart/heure_arrivee from all its rides
    if (data.prestation_id) {
      try {
        const { data: allRides } = await this.supabase
          .from('ride')
          .select(
            'presence_chargement, depart_chargement, arrivee_livraison, fin_livraison, order_index',
          )
          .eq('prestation_id', data.prestation_id)
          .order('order_index', { ascending: true });

        if (allRides && allRides.length > 0) {
          const firstRide = allRides[0];
          const lastRide = allRides[allRides.length - 1];
          const extractHHmm = (ts: string | null) => {
            if (!ts) return null;
            try {
              return new Date(ts).toTimeString().slice(0, 5);
            } catch {
              return null;
            }
          };
          const hd =
            extractHHmm(firstRide.presence_chargement) ||
            extractHHmm(firstRide.depart_chargement);
          const ha =
            extractHHmm(lastRide.fin_livraison) ||
            extractHHmm(lastRide.arrivee_livraison);
          if (hd || ha) {
            const prestUpdate: any = {};
            if (hd) prestUpdate.heure_depart = hd;
            if (ha) prestUpdate.heure_arrivee = ha;
            await this.supabase
              .from('prestation')
              .update(prestUpdate)
              .eq('id', data.prestation_id);
          }
        }
      } catch (syncErr) {
        this.logger.warn(
          `Failed to sync prestation times after ride update: ${syncErr}`,
        );
      }
    }

    // Log activity
    await this.activityService.log(
      ActivityType.RIDE_MODIFIE,
      ride.displayReference || ride.reference,
      ride.reference,
      userId,
      userName,
      EntityType.RIDE,
      ride.id,
      { prestationId: data.prestation_id },
    );

    return ride;
  }

  async remove(id: string, userId?: string, userName?: string) {
    // First check if ride exists
    const ride = await this.findOne(id);

    const { error } = await this.supabase.from('ride').delete().eq('id', id);

    if (error) {
      this.logger.error('Error deleting ride', error);
      throw new BadRequestException(error.message);
    }

    // Sync the prestation's etapes JSONB — remove the deleted ride's entry
    if (ride.prestationId) {
      try {
        const { data: prestationData } = await this.supabase
          .from('prestation')
          .select('etapes')
          .eq('id', ride.prestationId)
          .single();

        if (prestationData?.etapes && Array.isArray(prestationData.etapes)) {
          const updatedEtapes = prestationData.etapes.filter(
            (etape: any) => {
              if (typeof etape === 'object' && etape !== null) {
                return etape.ride_id !== id;
              }
              return true; // Keep legacy UUID entries
            },
          );

          // Only update if we actually removed something
          if (updatedEtapes.length !== prestationData.etapes.length) {
            await this.supabase
              .from('prestation')
              .update({ etapes: updatedEtapes })
              .eq('id', ride.prestationId);
          }
        }
      } catch (syncErr) {
        this.logger.warn(
          `Failed to sync prestation etapes after ride deletion: ${syncErr}`,
        );
      }
    }

    // Log activity with detailed info
    await this.activityService.log(
      ActivityType.RIDE_SUPPRIME,
      `Trajet ${ride.displayReference || ride.reference} supprimé de la prestation`,
      ride.reference,
      userId,
      userName,
      EntityType.RIDE,
      id,
      {
        prestationId: ride.prestationId,
        rideReference: ride.reference,
        rideDisplayReference: ride.displayReference,
      },
    );

    // Also log on the parent prestation so it appears in its activity feed
    if (ride.prestationId) {
      await this.activityService.log(
        ActivityType.PRESTATION_MODIFIEE,
        `Trajet ${ride.displayReference || ride.reference} supprimé`,
        ride.reference,
        userId,
        userName,
        EntityType.PRESTATION,
        ride.prestationId,
        {
          action: 'ride_deleted',
          rideId: id,
          rideReference: ride.reference,
        },
      );
    }

    return { message: 'Ride deleted successfully' };
  }

  // Reorder rides within a prestation
  async reorder(prestationId: string, rideIds: string[]) {
    // Verify prestation exists
    const { data: prestation, error: prestationError } = await this.supabase
      .from('prestation')
      .select('id')
      .eq('id', prestationId)
      .single();

    if (prestationError || !prestation) {
      throw new NotFoundException(
        `Prestation with ID ${prestationId} not found`,
      );
    }

    // Update order_index for each ride
    for (let i = 0; i < rideIds.length; i++) {
      const { error } = await this.supabase
        .from('ride')
        .update({ order_index: i })
        .eq('id', rideIds[i])
        .eq('prestation_id', prestationId);

      if (error) {
        this.logger.error('Error reordering ride', error);
        throw new BadRequestException(error.message);
      }
    }

    // Return updated list
    return this.findAll(prestationId);
  }

  // ============================================
  // Export Methods
  // ============================================

  async exportToExcel(): Promise<Buffer> {
    // Get all rides with full details
    const rides = await this.findAll();

    // Helper to format timestamp to date and time
    const formatTimestamp = (
      ts: string | null,
    ): { date: string; time: string } => {
      if (!ts) return { date: '', time: '' };
      try {
        const d = new Date(ts);
        const date = d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const time = d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return { date, time };
      } catch {
        return { date: '', time: '' };
      }
    };

    // Get ride status label
    // Status only changes when the timestamp is in the past
    const getStatusLabel = (ride: any): string => {
      const now = new Date();
      const isPast = (ts: string | null): boolean => {
        if (!ts) return false;
        return new Date(ts) <= now;
      };

      if (isPast(ride.finLivraison)) return 'Terminé';
      if (isPast(ride.arriveeLivraison)) return 'En livraison';
      if (isPast(ride.departChargement)) return 'En route';
      if (isPast(ride.presenceChargement)) return 'Chargement';
      return 'Planifié';
    };

    // Build export data
    const exportData = rides.map((ride: any) => {
      const presenceTs = formatTimestamp(ride.presenceChargement);
      const departTs = formatTimestamp(ride.departChargement);
      const arriveeTs = formatTimestamp(ride.arriveeLivraison);
      const finTs = formatTimestamp(ride.finLivraison);

      // Use addressDepart/addressArrivee, fallback to legacy address
      const addrDepart = ride.addressDepart || ride.address;
      const addrArrivee = ride.addressArrivee;

      return {
        reference: ride.reference || '',
        referenceClient: ride.referenceClient || '',
        prestationReference:
          ride.prestation?.displayReference || ride.prestation?.reference || '',
        clientName: ride.prestation?.contract?.client?.name || '',
        adresseDepart: addrDepart?.name || '',
        villeDepart: addrDepart?.city || '',
        adresseArrivee: addrArrivee?.name || '',
        villeArrivee: addrArrivee?.city || '',
        date: presenceTs.date || departTs.date || '',
        hPresence: presenceTs.time || '',
        hDepart: departTs.time || '',
        hArrivee: arriveeTs.time || '',
        hFin: finTs.time || '',
        duration: ride.duration || '',
        distanceKm: ride.distanceKm || '',
        vide: ride.vide ? 'Oui' : 'Non',
        statut: getStatusLabel(ride),
        comment: ride.comment || '',
      };
    });

    return this.excelService.generateExcel(exportData, RIDE_EXPORT_COLUMNS);
  }

  private transformRide(data: any) {
    // Determine display reference: use reference_client if available, otherwise internal reference
    const displayReference = data.reference_client || data.reference;

    // Transform address helper
    const transformAddress = (addr: any) => {
      if (!addr) return null;
      return {
        id: addr.id,
        reference: addr.reference,
        referenceClient: addr.reference_client,
        displayReference: addr.reference_client || addr.reference,
        name: addr.name,
        address: addr.address,
        postalCode: addr.postal_code,
        city: addr.city,
        country: addr.country,
        latitude: addr.latitude,
        longitude: addr.longitude,
      };
    };

    // Calculate distance between departure and arrival addresses
    const distanceKm = this.calculateDistanceKm(
      data.addressDepart || data.address,
      data.addressArrivee,
    );

    return {
      id: data.id,
      reference: data.reference,
      referenceClient: data.reference_client,
      displayReference: displayReference,
      prestationId: data.prestation_id,
      prestation: data.prestation
        ? {
            id: data.prestation.id,
            reference: data.prestation.reference,
            referenceClient: data.prestation.reference_client,
            displayReference:
              data.prestation.reference_client || data.prestation.reference,
            contract: data.prestation.contract
              ? {
                  id: data.prestation.contract.id,
                  reference: data.prestation.contract.reference,
                  referenceClient: data.prestation.contract.reference_client,
                  displayReference:
                    data.prestation.contract.reference_client ||
                    data.prestation.contract.reference,
                  name: data.prestation.contract.name,
                  client: data.prestation.contract.client
                    ? {
                        id: data.prestation.contract.client.id,
                        reference: data.prestation.contract.client.reference,
                        referenceClient:
                          data.prestation.contract.client.reference_client,
                        displayReference:
                          data.prestation.contract.client.reference_client ||
                          data.prestation.contract.client.reference,
                        name: data.prestation.contract.client.name,
                        initials: data.prestation.contract.client.initials,
                        avatarUrl: data.prestation.contract.client.avatar_url,
                        color: data.prestation.contract.client.color,
                      }
                    : null,
                }
              : null,
          }
        : null,
      // Legacy address field (for backward compatibility)
      addressId: data.address_id,
      address: transformAddress(data.address),
      // New departure/arrival address fields
      addressDepartId: data.address_depart,
      addressDepart: transformAddress(data.addressDepart),
      addressArriveeId: data.address_arrivee,
      addressArrivee: transformAddress(data.addressArrivee),
      orderIndex: data.order_index,
      heureDepart: data.heure_depart,
      heureArrivee: data.heure_arrivee,
      // MCom-0011: 4 mandatory timestamps
      presenceChargement: data.presence_chargement,
      departChargement: data.depart_chargement,
      arriveeLivraison: data.arrivee_livraison,
      finLivraison: data.fin_livraison,
      // Auto-calculated duration (Arrivée livraison - Présence chargement) in minutes
      duration: this.calculateDuration(
        data.presence_chargement,
        data.arrivee_livraison,
      ),
      // Auto-calculated distance in km (Haversine formula)
      distanceKm: distanceKm,
      vide: data.vide,
      comment: data.comment,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Calculate duration in minutes between two timestamps
   * MCom-018: Duration = Arrivée livraison - Présence chargement
   */
  private calculateDuration(
    start: string | null,
    end: string | null,
  ): number | null {
    if (!start || !end) return null;
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
      const diffMs = endDate.getTime() - startDate.getTime();
      return Math.round(diffMs / (1000 * 60)); // Convert to minutes
    } catch {
      return null;
    }
  }

  /**
   * Calculate distance in km between two addresses using Haversine formula
   * Returns null if coordinates are missing
   */
  private calculateDistanceKm(departure: any, arrival: any): number | null {
    if (!departure || !arrival) {
      this.logger.debug(
        `Distance calc: missing address - departure: ${!!departure}, arrival: ${!!arrival}`,
      );
      return null;
    }

    const lat1 = departure.latitude;
    const lon1 = departure.longitude;
    const lat2 = arrival.latitude;
    const lon2 = arrival.longitude;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      this.logger.debug(
        `Distance calc: missing coords - dep(${lat1}, ${lon1}), arr(${lat2}, ${lon2})`,
      );
      return null;
    }

    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Round to 1 decimal place
    return Math.round(distance * 10) / 10;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private transformDtoToDb(dto: CreateRideDto | UpdateRideDto) {
    const result: any = {};

    if ('prestationId' in dto && dto.prestationId !== undefined) {
      result.prestation_id = dto.prestationId;
    }
    if ('addressId' in dto && dto.addressId !== undefined) {
      result.address_id = dto.addressId;
    }
    if ('referenceClient' in dto && dto.referenceClient !== undefined) {
      result.reference_client = dto.referenceClient;
    }
    if ('orderIndex' in dto && dto.orderIndex !== undefined) {
      result.order_index = dto.orderIndex;
    }
    if ('heureDepart' in dto && dto.heureDepart !== undefined) {
      result.heure_depart = dto.heureDepart;
    }
    if ('heureArrivee' in dto && dto.heureArrivee !== undefined) {
      result.heure_arrivee = dto.heureArrivee;
    }
    // MCom-0011: 4 timestamps
    if ('presenceChargement' in dto && dto.presenceChargement !== undefined) {
      result.presence_chargement = dto.presenceChargement;
    }
    if ('departChargement' in dto && dto.departChargement !== undefined) {
      result.depart_chargement = dto.departChargement;
    }
    if ('arriveeLivraison' in dto && dto.arriveeLivraison !== undefined) {
      result.arrivee_livraison = dto.arriveeLivraison;
    }
    if ('finLivraison' in dto && dto.finLivraison !== undefined) {
      result.fin_livraison = dto.finLivraison;
    }
    // Address fields for loading/delivery
    if ('addressDepart' in dto && dto.addressDepart !== undefined) {
      result.address_depart = dto.addressDepart;
    }
    if ('addressArrivee' in dto && dto.addressArrivee !== undefined) {
      result.address_arrivee = dto.addressArrivee;
    }
    if ('vide' in dto && dto.vide !== undefined) {
      result.vide = dto.vide;
    }
    if ('comment' in dto && dto.comment !== undefined) {
      result.comment = dto.comment;
    }

    return result;
  }
}
