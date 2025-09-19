import request from 'supertest';
import app from '../../src/app';

describe('CSV Controller', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/upload', () => {
    it('should require both files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Both strings and classifications CSV files are required');
    });

    it('should process valid CSV files', async () => {
      const stringsCSV = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,Software,Tech,AI,PRE,1,Test prompt,Low risk,tech ai`;

      const classificationsCSV = `Topic,SubTopic,Industry,Classification
Tech,AI,Software,Category A`;

      const response = await request(app)
        .post('/api/upload')
        .attach('strings', Buffer.from(stringsCSV), 'strings.csv')
        .attach('classifications', Buffer.from(classificationsCSV), 'classifications.csv')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('strings');
      expect(response.body.data).toHaveProperty('classifications');
      expect(response.body.data).toHaveProperty('validation');
      expect(response.body.data.validation.isValid).toBe(true);
    });

    it('should detect validation errors', async () => {
      const stringsCSV = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,InvalidIndustry,InvalidTopic,InvalidSubtopic,PRE,1,Test prompt,Low risk,tech ai`;

      const classificationsCSV = `Topic,SubTopic,Industry,Classification
Tech,AI,Software,Category A`;

      const response = await request(app)
        .post('/api/upload')
        .attach('strings', Buffer.from(stringsCSV), 'strings.csv')
        .attach('classifications', Buffer.from(classificationsCSV), 'classifications.csv')
        .expect(200);

      expect(response.body.data.validation.isValid).toBe(false);
      expect(response.body.data.validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/validate', () => {
    it('should validate data integrity', async () => {
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

      const response = await request(app)
        .post('/api/validate')
        .send({ stringsData, classificationsData })
        .expect(200);

      expect(response.body).toHaveProperty('validation');
      expect(response.body.validation.isValid).toBe(true);
    });

    it('should require both data sets', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({ stringsData: [] })
        .expect(400);

      expect(response.body.error).toContain('Both strings and classifications data are required');
    });
  });

  describe('POST /api/export', () => {
    const validStringsData = [{
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

    const validClassificationsData = [{
      Topic: 'Tech',
      SubTopic: 'AI',
      Industry: 'Software',
      Classification: 'Category A'
    }];

    it('should export valid data', async () => {
      const response = await request(app)
        .post('/api/export')
        .send({
          stringsData: validStringsData,
          classificationsData: validClassificationsData
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('downloadUrls');
      expect(response.body.downloadUrls).toHaveLength(2);
    });

    it('should reject invalid data', async () => {
      const invalidStringsData = [{
        ...validStringsData[0],
        Industry: 'InvalidIndustry'
      }];

      const response = await request(app)
        .post('/api/export')
        .send({
          stringsData: invalidStringsData,
          classificationsData: validClassificationsData
        })
        .expect(400);

      expect(response.body.error).toContain('Data validation failed');
    });

    it('should require both data sets', async () => {
      const response = await request(app)
        .post('/api/export')
        .send({ stringsData: validStringsData })
        .expect(400);

      expect(response.body.error).toContain('Both strings and classifications data are required');
    });
  });
});