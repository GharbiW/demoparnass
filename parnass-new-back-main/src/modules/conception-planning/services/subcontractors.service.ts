import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import {
  CreateSubcontractorDto,
  UpdateSubcontractorDto,
  ListSubcontractorsQueryDto,
} from '../dto/subcontractor.dto';

@Injectable()
export class SubcontractorsService {
  private readonly logger = new Logger(SubcontractorsService.name);
  private get supabase() {
    return this.supabaseService.getClient();
  }

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(query: ListSubcontractorsQueryDto = {}) {
    let qb = this.supabase
      .from('subcontractor')
      .select('*')
      .order('name', { ascending: true });

    if (query.status) qb = qb.eq('status', query.status);
    if (query.search) {
      qb = qb.or(`name.ilike.%${query.search}%,contact_name.ilike.%${query.search}%,city.ilike.%${query.search}%`);
    }
    if (query.limit) qb = qb.limit(query.limit);
    if (query.offset) qb = qb.range(query.offset, query.offset + (query.limit || 50) - 1);

    const { data, error } = await qb;
    if (error) {
      this.logger.error('Error fetching subcontractors', error);
      throw new BadRequestException(error.message);
    }
    return (data || []).map((s: any) => this.transform(s));
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('subcontractor')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException(`Subcontractor ${id} not found`);
      throw new BadRequestException(error.message);
    }
    return this.transform(data);
  }

  async create(dto: CreateSubcontractorDto) {
    const row = this.dtoToDb(dto);

    const { data, error } = await this.supabase
      .from('subcontractor')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error creating subcontractor', error);
      throw new BadRequestException(error.message);
    }
    return this.transform(data);
  }

  async update(id: string, dto: UpdateSubcontractorDto) {
    await this.findOne(id);

    const row: any = {};
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.siret !== undefined) row.siret = dto.siret;
    if (dto.contactName !== undefined) row.contact_name = dto.contactName;
    if (dto.phone !== undefined) row.phone = dto.phone;
    if (dto.email !== undefined) row.email = dto.email;
    if (dto.address !== undefined) row.address = dto.address;
    if (dto.city !== undefined) row.city = dto.city;
    if (dto.specialties !== undefined) row.specialties = dto.specialties;
    if (dto.vehicleTypes !== undefined) row.vehicle_types = dto.vehicleTypes;
    if (dto.rating !== undefined) row.rating = dto.rating;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.contractCount !== undefined) row.contract_count = dto.contractCount;
    if (dto.activeVehicles !== undefined) row.active_vehicles = dto.activeVehicles;
    if (dto.notes !== undefined) row.notes = dto.notes;

    const { data, error } = await this.supabase
      .from('subcontractor')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error updating subcontractor', error);
      throw new BadRequestException(error.message);
    }
    return this.transform(data);
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('subcontractor')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Subcontractor deleted' };
  }

  private dtoToDb(dto: CreateSubcontractorDto): any {
    return {
      name: dto.name,
      siret: dto.siret || null,
      contact_name: dto.contactName || null,
      phone: dto.phone || null,
      email: dto.email || null,
      address: dto.address || null,
      city: dto.city || null,
      specialties: dto.specialties || [],
      vehicle_types: dto.vehicleTypes || [],
      rating: dto.rating || 0,
      notes: dto.notes || null,
    };
  }

  private transform(data: any) {
    return {
      id: data.id,
      name: data.name,
      siret: data.siret,
      contactName: data.contact_name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      specialties: data.specialties || [],
      vehicleTypes: data.vehicle_types || [],
      rating: data.rating,
      status: data.status,
      contractCount: data.contract_count,
      activeVehicles: data.active_vehicles,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
