import { StringsRow, ClassificationsRow } from './csvService';

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

export interface CombinationKey {
  topic: string;
  subtopic: string;
  industry: string;
}

class ValidationService {
  validateDataIntegrity(
    stringsData: StringsRow[],
    classificationsData: ClassificationsRow[]
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const validCombinations = this.createValidCombinationsSet(classificationsData);

    stringsData.forEach((row, index) => {
      const rowNumber = index + 1;
      const combination: CombinationKey = {
        topic: row.Topic.toLowerCase().trim(),
        subtopic: row.Subtopic.toLowerCase().trim(),
        industry: row.Industry.toLowerCase().trim()
      };

      const combinationKey = this.getCombinationKey(combination);

      if (!validCombinations.has(combinationKey)) {
        errors.push({
          row: rowNumber,
          field: 'Topic + SubTopic + Industry',
          value: `${row.Topic} + ${row.Subtopic} + ${row.Industry}`,
          message: `Combination does not exist in classifications data`
        });
      }

      if (!row.Topic || row.Topic.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Topic',
          value: row.Topic,
          message: 'Topic cannot be empty'
        });
      }

      if (!row.Subtopic || row.Subtopic.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Subtopic',
          value: row.Subtopic,
          message: 'Subtopic cannot be empty'
        });
      }

      if (!row.Industry || row.Industry.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Industry',
          value: row.Industry,
          message: 'Industry cannot be empty'
        });
      }
    });

    const invalidRowNumbers = [...new Set(errors.map(error => error.row))];

    return {
      isValid: errors.length === 0,
      errors,
      summary: {
        totalRows: stringsData.length,
        validRows: stringsData.length - invalidRowNumbers.length,
        invalidRows: invalidRowNumbers.length,
        invalidRowNumbers
      }
    };
  }

  private createValidCombinationsSet(classificationsData: ClassificationsRow[]): Set<string> {
    const validCombinations = new Set<string>();

    classificationsData.forEach(row => {
      const combination: CombinationKey = {
        topic: row.Topic.toLowerCase().trim(),
        subtopic: row.SubTopic.toLowerCase().trim(),
        industry: row.Industry.toLowerCase().trim()
      };

      validCombinations.add(this.getCombinationKey(combination));
    });

    return validCombinations;
  }

  private getCombinationKey(combination: CombinationKey): string {
    return `${combination.topic}|${combination.subtopic}|${combination.industry}`;
  }

  getValidCombinationsForAutocomplete(classificationsData: ClassificationsRow[]) {
    const combinations = classificationsData.map(row => ({
      topic: row.Topic,
      subtopic: row.SubTopic,
      industry: row.Industry,
      classification: row.Classification
    }));

    return {
      combinations,
      topics: [...new Set(combinations.map(c => c.topic))].sort(),
      subtopics: [...new Set(combinations.map(c => c.subtopic))].sort(),
      industries: [...new Set(combinations.map(c => c.industry))].sort()
    };
  }

  validateSingleRow(
    row: StringsRow,
    rowIndex: number,
    validCombinations: Set<string>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const rowNumber = rowIndex + 1;

    const combination: CombinationKey = {
      topic: row.Topic.toLowerCase().trim(),
      subtopic: row.Subtopic.toLowerCase().trim(),
      industry: row.Industry.toLowerCase().trim()
    };

    const combinationKey = this.getCombinationKey(combination);

    if (!validCombinations.has(combinationKey)) {
      errors.push({
        row: rowNumber,
        field: 'Topic + SubTopic + Industry',
        value: `${row.Topic} + ${row.Subtopic} + ${row.Industry}`,
        message: `Combination does not exist in classifications data`
      });
    }

    const requiredFields: (keyof StringsRow)[] = ['Topic', 'Subtopic', 'Industry'];

    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: rowNumber,
          field,
          value: row[field],
          message: `${field} cannot be empty`
        });
      }
    });

    return errors;
  }
}

export const validationService = new ValidationService();