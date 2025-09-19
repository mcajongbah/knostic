import { csvService } from '../../src/services/csvService';

describe('CSVService', () => {
  describe('parseCSV', () => {
    it('should parse valid strings CSV', async () => {
      const csvContent = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,Software,Tech,AI,PRE,1,Test prompt,Low risk,tech ai`;

      const buffer = Buffer.from(csvContent);
      const result = await csvService.parseCSV(buffer, 'strings');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Tier: '1',
        Industry: 'Software',
        Topic: 'Tech',
        Subtopic: 'AI',
        Prefix: 'PRE',
        'Fuzzing-Idx': '1',
        Prompt: 'Test prompt',
        Risks: 'Low risk',
        Keywords: 'tech ai'
      });
    });

    it('should parse valid classifications CSV', async () => {
      const csvContent = `Topic,SubTopic,Industry,Classification
Tech,AI,Software,Category A`;

      const buffer = Buffer.from(csvContent);
      const result = await csvService.parseCSV(buffer, 'classifications');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Topic: 'Tech',
        SubTopic: 'AI',
        Industry: 'Software',
        Classification: 'Category A'
      });
    });

    it('should handle CSV with extra whitespace', async () => {
      const csvContent = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
 1 , Software , Tech , AI ,PRE,1,Test prompt,Low risk,tech ai`;

      const buffer = Buffer.from(csvContent);
      const result = await csvService.parseCSV(buffer, 'strings') as any[];

      expect((result[0] as any).Tier).toBe('1');
      expect((result[0] as any).Industry).toBe('Software');
      expect((result[0] as any).Topic).toBe('Tech');
    });

    it('should reject CSV with missing required fields', async () => {
      const csvContent = `Tier,Industry,Topic
1,Software,Tech`;

      const buffer = Buffer.from(csvContent);

      await expect(csvService.parseCSV(buffer, 'strings')).rejects.toThrow(
        'Missing required field in strings CSV'
      );
    });
  });

  describe('generateCSV', () => {
    it('should generate valid CSV from data', async () => {
      const data = [
        {
          Tier: '1',
          Industry: 'Software',
          Topic: 'Tech',
          Subtopic: 'AI',
          Prefix: 'PRE',
          'Fuzzing-Idx': '1',
          Prompt: 'Test prompt',
          Risks: 'Low risk',
          Keywords: 'tech ai'
        }
      ];

      const result = await csvService.generateCSV(data);
      const csvString = result.toString();

      expect(csvString).toContain('Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords');
      expect(csvString).toContain('1,Software,Tech,AI,PRE,1,Test prompt,Low risk,tech ai');
    });
  });

  describe('generateExportFiles', () => {
    it('should generate export files with timestamp', async () => {
      const stringsData = [{
        Tier: '1',
        Industry: 'Software',
        Topic: 'Tech',
        Subtopic: 'AI',
        Prefix: 'PRE',
        'Fuzzing-Idx': '1',
        Prompt: 'Test prompt',
        Risks: 'Low risk',
        Keywords: 'tech ai'
      }];

      const classificationsData = [{
        Topic: 'Tech',
        SubTopic: 'AI',
        Industry: 'Software',
        Classification: 'Category A'
      }];

      const result = await csvService.generateExportFiles(
        stringsData,
        classificationsData
      );

      expect(result).toHaveLength(2);
      expect(result[0].filename).toMatch(/^strings-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result[1].filename).toMatch(/^classifications-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result[0].mimetype).toBe('text/csv');
      expect(result[1].mimetype).toBe('text/csv');
    });

    it('should reject unsupported format', async () => {
      await expect(csvService.generateExportFiles([], [], 'xlsx')).rejects.toThrow(
        'Only CSV format is currently supported'
      );
    });
  });

  describe('getUniqueValues', () => {
    it('should return unique sorted values', () => {
      const data = [
        { Topic: 'B', SubTopic: 'AI', Industry: 'Software', Classification: 'Cat1' },
        { Topic: 'A', SubTopic: 'ML', Industry: 'Software', Classification: 'Cat2' },
        { Topic: 'B', SubTopic: 'AI', Industry: 'Hardware', Classification: 'Cat3' }
      ];

      const topics = csvService.getUniqueValues(data, 'Topic');
      const industries = csvService.getUniqueValues(data, 'Industry');

      expect(topics).toEqual(['A', 'B']);
      expect(industries).toEqual(['Hardware', 'Software']);
    });

    it('should filter out empty values', () => {
      const data = [
        { Topic: 'Tech', SubTopic: '', Industry: 'Software', Classification: 'Cat1' },
        { Topic: '', SubTopic: 'AI', Industry: 'Software', Classification: 'Cat2' }
      ];

      const topics = csvService.getUniqueValues(data, 'Topic');
      const subtopics = csvService.getUniqueValues(data, 'SubTopic');

      expect(topics).toEqual(['Tech']);
      expect(subtopics).toEqual(['AI']);
    });
  });
});