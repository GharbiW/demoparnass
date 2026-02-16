export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  duplicateCount?: number; // MCom-001: Count of duplicates skipped during import
  errors: ImportError[];
  createdIds: string[];
}

export interface ColumnConfig {
  frenchHeader: string;
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'enum' | 'array';
  enumValues?: string[];
  defaultValue?: any;
  transform?: (value: any) => any;
}

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: ImportError[];
}

export interface ParseResult {
  rows: ParsedRow[];
  validRows: Record<string, any>[];
  errors: ImportError[];
}
