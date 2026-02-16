import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  ColumnConfig,
  ImportError,
  ParseResult,
  ParsedRow,
} from '../dto/import-result.dto';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  /**
   * Generate an Excel file from data with French headers
   * Required fields are marked with (*)
   */
  generateExcel(data: any[], columns: ColumnConfig[]): Buffer {
    // Create worksheet data with French headers - add (*) for required fields
    const headers = columns.map((col) =>
      col.required ? `${col.frenchHeader} (*)` : col.frenchHeader,
    );
    const rows = data.map((item) =>
      columns.map((col) => {
        const value = item[col.field];
        // Handle special formatting
        if (col.type === 'boolean') {
          return value ? 'Oui' : 'Non';
        }
        if (col.type === 'date' && value) {
          return this.formatDateForExcel(value);
        }
        if (col.type === 'array' && Array.isArray(value)) {
          return value.join(', ');
        }
        return value ?? '';
      }),
    );

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths (account for (*) suffix on required fields)
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.frenchHeader.length + (col.required ? 6 : 2), 15),
    }));
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');

    // Generate buffer
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  /**
   * Generate a template Excel file with French headers and instructions
   * Required fields are marked with (*)
   * @param extraInstructions - Optional extra instructions to append (array of strings)
   */
  generateTemplate(
    columns: ColumnConfig[],
    entityName: string,
    exampleRow?: Record<string, any>,
    extraInstructions?: string[],
  ): Buffer {
    // Create data sheet - add (*) for required fields
    const headers = columns.map((col) =>
      col.required ? `${col.frenchHeader} (*)` : col.frenchHeader,
    );
    const wsData: any[][] = [headers];

    // Add example row if provided
    if (exampleRow) {
      const example = columns.map((col) => {
        const value = exampleRow[col.field];
        if (col.type === 'boolean') {
          return value ? 'Oui' : 'Non';
        }
        return value ?? '';
      });
      wsData.push(example);
    }

    const wsDataSheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths (account for (*) suffix on required fields)
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.frenchHeader.length + (col.required ? 6 : 2), 20),
    }));
    wsDataSheet['!cols'] = colWidths;

    // Create instructions sheet
    const instructions: string[][] = [
      [`Instructions d'import - ${entityName}`],
      [''],
      [
        'Comment utiliser ce modèle:',
      ],
      [
        '1. Remplissez les données à partir de la ligne 2 de la feuille "Données"',
      ],
      ['2. Les colonnes marquées (*) sont obligatoires'],
      [
        '3. Pour les références personnalisées, laissez vide pour génération automatique',
      ],
      [''],
      ['Description des colonnes:'],
      [''],
    ];

    columns.forEach((col) => {
      const required = col.required ? ' (*)' : '';
      let description = `${col.frenchHeader}${required}`;

      if (col.type === 'enum' && col.enumValues) {
        description += ` - Valeurs acceptées: ${col.enumValues.join(', ')}`;
      } else if (col.type === 'boolean') {
        description += ' - Valeurs acceptées: Oui, Non';
      } else if (col.type === 'date') {
        description += ' - Format: JJ/MM/AAAA ou AAAA-MM-JJ';
      } else if (col.type === 'email') {
        description += ' - Format email valide';
      } else if (col.type === 'array') {
        description += ' - Valeurs séparées par virgule';
      }

      if (col.defaultValue !== undefined) {
        description += ` - Défaut: ${col.defaultValue}`;
      }

      instructions.push([description]);
    });

    // Add extra instructions if provided
    if (extraInstructions && extraInstructions.length > 0) {
      instructions.push(['']);
      extraInstructions.forEach((line) => {
        instructions.push([line]);
      });
    }

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 80 }];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDataSheet, 'Données');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  /**
   * Generate a plain text guidelines file for import
   * @param columns - Column configuration
   * @param entityName - Entity name in French
   * @param extraInstructions - Optional extra instructions to append
   */
  generateGuidelinesTxt(
    columns: ColumnConfig[],
    entityName: string,
    extraInstructions?: string[],
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(60));
    lines.push(`INSTRUCTIONS D'IMPORT - ${entityName.toUpperCase()}`);
    lines.push('='.repeat(60));
    lines.push('');

    // General instructions
    lines.push('COMMENT UTILISER CE MODÈLE:');
    lines.push('-'.repeat(30));
    lines.push('1. Remplissez les données à partir de la ligne 2 de la feuille "Données"');
    lines.push('2. Les colonnes marquées (*) sont obligatoires');
    lines.push('3. Pour les références personnalisées, laissez vide pour génération automatique');
    lines.push('');

    // Required columns
    const requiredCols = columns.filter((col) => col.required);
    if (requiredCols.length > 0) {
      lines.push('COLONNES OBLIGATOIRES:');
      lines.push('-'.repeat(30));
      requiredCols.forEach((col) => {
        let desc = `• ${col.frenchHeader} (*)`;
        if (col.type === 'enum' && col.enumValues) {
          desc += ` - Valeurs: ${col.enumValues.join(', ')}`;
        } else if (col.type === 'date') {
          desc += ' - Format: JJ/MM/AAAA ou AAAA-MM-JJ';
        } else if (col.type === 'boolean') {
          desc += ' - Valeurs: Oui, Non';
        }
        lines.push(desc);
      });
      lines.push('');
    }

    // Optional columns
    const optionalCols = columns.filter((col) => !col.required);
    if (optionalCols.length > 0) {
      lines.push('COLONNES OPTIONNELLES:');
      lines.push('-'.repeat(30));
      optionalCols.forEach((col) => {
        let desc = `• ${col.frenchHeader}`;
        if (col.type === 'enum' && col.enumValues) {
          desc += ` - Valeurs: ${col.enumValues.join(', ')}`;
        } else if (col.type === 'date') {
          desc += ' - Format: JJ/MM/AAAA ou AAAA-MM-JJ';
        } else if (col.type === 'boolean') {
          desc += ' - Valeurs: Oui, Non';
        } else if (col.type === 'array') {
          desc += ' - Valeurs séparées par virgule';
        }
        if (col.defaultValue !== undefined) {
          desc += ` (défaut: ${col.defaultValue})`;
        }
        lines.push(desc);
      });
      lines.push('');
    }

    // Extra instructions
    if (extraInstructions && extraInstructions.length > 0) {
      lines.push('');
      extraInstructions.forEach((line) => {
        lines.push(line);
      });
    }

    return lines.join('\n');
  }

  /**
   * Parse an Excel file and validate against column configuration
   */
  parseExcel(buffer: Buffer, columns: ColumnConfig[]): ParseResult {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];

    // Convert to array of arrays
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rawData.length < 2) {
      return {
        rows: [],
        validRows: [],
        errors: [
          {
            row: 0,
            field: '',
            value: null,
            message: 'Le fichier est vide ou ne contient que des en-têtes',
          },
        ],
      };
    }

    // Get headers from first row and normalize (remove (*) suffix)
    const fileHeaders = rawData[0].map((h: any) =>
      String(h || '').trim(),
    );
    
    // Helper to normalize header (remove (*) suffix for comparison)
    const normalizeHeader = (header: string): string => {
      return header.replace(/\s*\(\*\)\s*$/, '').trim().toLowerCase();
    };

    // Create header to column mapping
    const headerToColumn = new Map<number, ColumnConfig>();
    columns.forEach((col) => {
      const headerIndex = fileHeaders.findIndex(
        (h: string) =>
          normalizeHeader(h) === col.frenchHeader.toLowerCase(),
      );
      if (headerIndex !== -1) {
        headerToColumn.set(headerIndex, col);
      }
    });

    // Check for missing required columns
    const missingRequired = columns.filter(
      (col) =>
        col.required &&
        !fileHeaders.some(
          (h: string) =>
            normalizeHeader(h) === col.frenchHeader.toLowerCase(),
        ),
    );

    const globalErrors: ImportError[] = missingRequired.map((col) => ({
      row: 1,
      field: col.field,
      value: null,
      message: `Colonne obligatoire manquante: "${col.frenchHeader}"`,
    }));

    if (globalErrors.length > 0) {
      return {
        rows: [],
        validRows: [],
        errors: globalErrors,
      };
    }

    // Parse data rows
    const parsedRows: ParsedRow[] = [];
    const validRows: Record<string, any>[] = [];
    const allErrors: ImportError[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip completely empty rows
      if (!row || row.every((cell: any) => cell === undefined || cell === null || cell === '')) {
        continue;
      }

      const rowNumber = i + 1; // Excel rows are 1-indexed
      const rowData: Record<string, any> = {};
      const rowErrors: ImportError[] = [];

      // Process each column
      columns.forEach((col) => {
        const headerIndex = fileHeaders.findIndex(
          (h: string) =>
            normalizeHeader(h) === col.frenchHeader.toLowerCase(),
        );

        let value =
          headerIndex !== -1 ? row[headerIndex] : undefined;

        // Handle empty values
        if (value === undefined || value === null || value === '') {
          if (col.required) {
            rowErrors.push({
              row: rowNumber,
              field: col.field,
              value: value,
              message: `Le champ "${col.frenchHeader}" est requis`,
            });
          } else if (col.defaultValue !== undefined) {
            value = col.defaultValue;
          } else {
            value = null;
          }
        } else {
          // Validate and transform value based on type
          const result = this.validateAndTransformValue(
            value,
            col,
            rowNumber,
          );
          if (result.error) {
            rowErrors.push(result.error);
          }
          value = result.value;
        }

        rowData[col.field] = value;
      });

      parsedRows.push({
        rowNumber,
        data: rowData,
        errors: rowErrors,
      });

      if (rowErrors.length === 0) {
        validRows.push(rowData);
      }

      allErrors.push(...rowErrors);
    }

    return {
      rows: parsedRows,
      validRows,
      errors: allErrors,
    };
  }

  private validateAndTransformValue(
    value: any,
    col: ColumnConfig,
    rowNumber: number,
  ): { value: any; error?: ImportError } {
    const stringValue = String(value).trim();

    switch (col.type) {
      case 'string':
        return { value: stringValue };

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return {
            value: null,
            error: {
              row: rowNumber,
              field: col.field,
              value: value,
              message: `Le champ "${col.frenchHeader}" doit être un nombre`,
            },
          };
        }
        return { value: num };

      case 'boolean':
        const boolValue = stringValue.toLowerCase();
        if (['oui', 'yes', 'true', '1', 'vrai'].includes(boolValue)) {
          return { value: true };
        }
        if (['non', 'no', 'false', '0', 'faux'].includes(boolValue)) {
          return { value: false };
        }
        return {
          value: false,
          error: {
            row: rowNumber,
            field: col.field,
            value: value,
            message: `Le champ "${col.frenchHeader}" doit être Oui ou Non`,
          },
        };

      case 'date':
        const date = this.parseDate(value);
        if (!date) {
          return {
            value: null,
            error: {
              row: rowNumber,
              field: col.field,
              value: value,
              message: `Le champ "${col.frenchHeader}" doit être une date valide (JJ/MM/AAAA ou AAAA-MM-JJ)`,
            },
          };
        }
        return { value: date };

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return {
            value: stringValue,
            error: {
              row: rowNumber,
              field: col.field,
              value: value,
              message: `Le champ "${col.frenchHeader}" doit être un email valide`,
            },
          };
        }
        return { value: stringValue };

      case 'enum':
        if (col.enumValues) {
          const matchedValue = col.enumValues.find(
            (v) => v.toLowerCase() === stringValue.toLowerCase(),
          );
          if (!matchedValue) {
            return {
              value: stringValue,
              error: {
                row: rowNumber,
                field: col.field,
                value: value,
                message: `Valeur "${value}" invalide pour "${col.frenchHeader}". Valeurs acceptées: ${col.enumValues.join(', ')}`,
              },
            };
          }
          return { value: matchedValue };
        }
        return { value: stringValue };

      case 'array':
        const arrayValue = stringValue
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        return { value: arrayValue };

      default:
        return { value: stringValue };
    }
  }

  private parseDate(value: any): string | null {
    if (!value) return null;

    // Handle Excel serial date numbers
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        const year = date.y;
        const month = String(date.m).padStart(2, '0');
        const day = String(date.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    const stringValue = String(value).trim();

    // Try DD/MM/YYYY format
    const dmyMatch = stringValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try YYYY-MM-DD format
    const ymdMatch = stringValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
  }

  private formatDateForExcel(value: string): string {
    if (!value) return '';
    // Convert YYYY-MM-DD to DD/MM/YYYY for French format
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return value;
  }
}
