export interface StringsRow {
  Tier: string;
  Industry: string;
  Topic: string;
  Subtopic: string;
  Prefix: string;
  'Fuzzing-Idx': string;
  Prompt: string;
  Risks: string;
  Keywords: string;
}

export interface ClassificationsRow {
  Topic: string;
  SubTopic: string;
  Industry: string;
  Classification: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    invalidRowNumbers: number[];
  };
}

export interface UploadedFiles {
  strings: File | null;
  classifications: File | null;
}

export interface CSVData {
  strings: StringsRow[];
  classifications: ClassificationsRow[];
  validation: ValidationResult | null;
}