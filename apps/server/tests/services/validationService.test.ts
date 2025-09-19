import { validationService } from '../../src/services/validationService';
import { StringsRow, ClassificationsRow } from '../../src/services/csvService';

describe('ValidationService', () => {
  const mockClassificationsData: ClassificationsRow[] = [
    { Topic: 'Tech', SubTopic: 'AI', Industry: 'Software', Classification: 'Category A' },
    { Topic: 'Finance', SubTopic: 'Banking', Industry: 'FinTech', Classification: 'Category B' },
    { Topic: 'Healthcare', SubTopic: 'Diagnostics', Industry: 'MedTech', Classification: 'Category C' }
  ];

  const mockValidStringsData: StringsRow[] = [
    {
      Tier: '1',
      Industry: 'Software',
      Topic: 'Tech',
      Subtopic: 'AI',
      Prefix: 'PRE',
      'Fuzzing-Idx': '1',
      Prompt: 'Test prompt',
      Risks: 'Low risk',
      Keywords: 'tech, ai'
    }
  ];

  const mockInvalidStringsData: StringsRow[] = [
    {
      Tier: '1',
      Industry: 'InvalidIndustry',
      Topic: 'InvalidTopic',
      Subtopic: 'InvalidSubtopic',
      Prefix: 'PRE',
      'Fuzzing-Idx': '1',
      Prompt: 'Test prompt',
      Risks: 'Low risk',
      Keywords: 'tech, ai'
    }
  ];

  describe('validateDataIntegrity', () => {
    it('should return valid result for matching data', () => {
      const result = validationService.validateDataIntegrity(
        mockValidStringsData,
        mockClassificationsData
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.validRows).toBe(1);
      expect(result.summary.invalidRows).toBe(0);
    });

    it('should return invalid result for non-matching data', () => {
      const result = validationService.validateDataIntegrity(
        mockInvalidStringsData,
        mockClassificationsData
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.summary.validRows).toBe(0);
      expect(result.summary.invalidRows).toBe(1);
    });

    it('should validate empty fields', () => {
      const invalidData: StringsRow[] = [
        {
          Tier: '1',
          Industry: '',
          Topic: '',
          Subtopic: 'AI',
          Prefix: 'PRE',
          'Fuzzing-Idx': '1',
          Prompt: 'Test prompt',
          Risks: 'Low risk',
          Keywords: 'tech, ai'
        }
      ];

      const result = validationService.validateDataIntegrity(
        invalidData,
        mockClassificationsData
      );

      expect(result.isValid).toBe(false);

      const emptyFieldErrors = result.errors.filter(error =>
        error.message.includes('cannot be empty')
      );
      expect(emptyFieldErrors.length).toBeGreaterThan(0);
    });

    it('should handle case insensitive matching', () => {
      const mixedCaseData: StringsRow[] = [
        {
          Tier: '1',
          Industry: 'SOFTWARE',
          Topic: 'tech',
          Subtopic: 'ai',
          Prefix: 'PRE',
          'Fuzzing-Idx': '1',
          Prompt: 'Test prompt',
          Risks: 'Low risk',
          Keywords: 'tech, ai'
        }
      ];

      const result = validationService.validateDataIntegrity(
        mixedCaseData,
        mockClassificationsData
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('getValidCombinationsForAutocomplete', () => {
    it('should return unique values for autocomplete', () => {
      const result = validationService.getValidCombinationsForAutocomplete(
        mockClassificationsData
      );

      expect(result.topics).toEqual(['Finance', 'Healthcare', 'Tech']);
      expect(result.industries).toEqual(['FinTech', 'MedTech', 'Software']);
      expect(result.subtopics).toEqual(['AI', 'Banking', 'Diagnostics']);
      expect(result.combinations).toHaveLength(3);
    });
  });
});