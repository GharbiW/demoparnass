// ============================================
// Factorial API Response Types
// ============================================

export interface FactorialEmployee {
  id: number;
  access_id?: number; // User access ID (for training memberships)
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
  login_email?: string;
  phone_number?: string;
  birthday_on?: string;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  country?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
  terminated_on?: string | null;
  is_terminating: boolean;
}

export interface FactorialTeam {
  id: number;
  name: string;
  employee_ids: number[];
  lead_ids: number[];
  company_id: number;
}

export interface FactorialMembership {
  id: number;
  team_id: number;
  employee_id: number;
}

export interface FactorialLeave {
  id: number;
  employee_id: number;
  start_on: string;
  finish_on?: string;
  half_day?: string;
  description?: string;
  approved?: boolean;
  leave_type_name?: string;
}

export interface FactorialCustomField {
  id: number;
  label: string;        // v2025 API
  label_text?: string;  // v2026 API uses label_text instead of label
  slug?: string;
  name?: string;
  field_type: string;
  required?: boolean;
  scope?: string;
  legal_entity_id?: number;
  legal_entity_name?: string;
  position?: number;
  options?: string[];
  min_value?: number | null;
  max_value?: number | null;
}

export interface FactorialCustomFieldValue {
  id: number;
  field_id: number;
  custom_field_id?: number;       // Some API versions use this instead of field_id
  employee_id?: number;           // v2025 API
  valuable_id?: number;           // v2026 API uses valuable_id (= employee_id when valuable_type='Employee')
  valuable_type?: string;         // v2026: 'Employee' | 'Document' etc.
  value: string;
  option_id?: number;             // v2025 API
  single_choice_value?: string | null;  // v2026 API for single_choice fields
  date_value?: string | null;           // v2026 API for date fields
  long_text_value?: string | null;      // v2026 API for long_text fields
  cents_value?: number | null;          // v2026 API for cents fields
  label?: string;                       // v2026 API returns label on each value
  custom_field_identifier?: string;     // v2026 unique identifier
  usage_group_id?: number;
  usage_group_slug?: string;
}

export interface FactorialCustomFieldOption {
  id: number;
  field_id: number;
  custom_field_id?: number;
  label: string;
  value?: string;
  position?: number;
}

export interface FactorialResponseMeta {
  has_previous_page: boolean;
  has_next_page: boolean;
  limit: number;
  total: number;
}

export interface FactorialPaginatedResponse<T> {
  data: T[];
  meta: FactorialResponseMeta;
}

// Mapped custom attributes from Factorial
export interface FactorialCustomAttributes {
  shift?: string; // 'j' = jour, 'n' = nuit, autre = FULL
  availableOnWeekends?: string; // 'oui' / 'non'
  forfaitWeekend?: string;
  lieuPrisePoste?: string;
  dateRemiseCarteAs24?: string;
  numerosCartesAs24?: string;
  dateRestitutionAs24?: string;
  permisDeConduire?: string;
  fco?: string;
  adr?: string;
  habilitation?: string;
  formation1123911262?: string;
  visiteMedicale?: string;
}

// ============================================
// Open Shift Types (Attendance)
// ============================================

export interface FactorialOpenShift {
  id: number;
  employee_id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Training Types
// ============================================

export interface FactorialTraining {
  id: number;
  name: string;
  description?: string;
  company_id: number;
  responsible_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  duration_hours?: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface FactorialTrainingSession {
  id: number;
  training_id: number;
  name?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  max_attendees?: number;
  status?: string;
}

export interface FactorialTrainingMembership {
  id: number;
  training_id: number;
  access_id: number; // User access ID (NOT employee_id!)
  employee_id?: number; // May not be present - use access_id instead
  status?: string;
  training_completed_at?: string;
  training_due_date?: string;
}

// ============================================
// Contract Types
// ============================================

export interface FactorialContractVersion {
  id: number;
  employee_id: number;
  job_title?: string;
  effective_on: string;
  ends_on?: string;
  working_hours?: number;
  working_hours_frequency?: string;
  trial_period_ends_on?: string;
  salary_amount?: number;
  salary_frequency?: string;
  job_catalog_level_id?: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Attendance Types
// ============================================

export interface FactorialAttendanceShift {
  id: number;
  employee_id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  workable: boolean;
  observations?: string;
  location_id?: number;
  created_at: string;
  updated_at: string;
}

export interface FactorialLeaveType {
  id: number;
  name: string;
  color?: string;
  accrues?: boolean;
  active?: boolean;
}

// ============================================
// Document Types
// ============================================

export interface FactorialDocument {
  id: number;
  name: string;
  filename?: string;
  public: boolean;
  folder_id?: number;
  company_id: number;
  signee_ids?: number[];
  is_pending_assignment?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FactorialFolder {
  id: number;
  name: string;
  company_id: number;
  parent_id?: number;
  active?: boolean;
}
