import request from 'supertest';
import express from 'express';
import { enrollmentRouter } from '../../controllers/enrollment';

// Mock the database and services
jest.mock('../../config/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    transaction: jest.fn(),
  },
  labEnrollments: {},
  labProvisions: {},
  provisioningQueue: {},
}));

jest.mock('../../services/kafka-producer', () => ({
  kafkaProducerService: {
    enrollLab: jest.fn(),
  }
}));

const app = express();
app.use(express.json());
app.use('/api/enrollment', enrollmentRouter);

describe('Enrollment API - Working Tests', () => {
  const { db } = require('../../config/database');
  const { kafkaProducerService } = require('../../services/kafka-producer');

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    const mockQueryBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    db.select.mockReturnValue(mockQueryBuilder);
    db.insert.mockReturnValue(mockQueryBuilder);
    db.update.mockReturnValue(mockQueryBuilder);
    db.transaction.mockImplementation(async (callback: any) => callback(db));
    kafkaProducerService.enrollLab.mockResolvedValue(true);
  });

  describe('POST /enroll', () => {
    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({ labId: 'test-lab-id' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('"userId" is required');
    });

    it('should return 400 for missing labId', async () => {
      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({ userId: 'test-user-id' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('"labId" is required');
    });

    it('should successfully create an enrollment', async () => {
      // Mock database to return no existing enrollment
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No existing enrollment
      };
      db.select.mockReturnValue(mockQuery);

      // Mock insert to return new enrollment
      const newEnrollment = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        labId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'pending',
        progress: 0,
        enrolledAt: new Date().toISOString(),
      };

      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([newEnrollment]),
      };
      db.insert.mockReturnValue(mockInsert);

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440002',
          labId: '550e8400-e29b-41d4-a716-446655440003'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollmentId).toBeDefined();
      expect(response.body.data.userId).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(response.body.data.labId).toBe('550e8400-e29b-41d4-a716-446655440003');
      expect(kafkaProducerService.enrollLab).toHaveBeenCalled();
    });

    it('should return 409 for duplicate enrollment', async () => {
      // Mock database to return existing enrollment
      const existingEnrollment = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        labId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'pending',
      };

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([existingEnrollment]),
      };
      db.select.mockReturnValue(mockQuery);

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440002',
          labId: '550e8400-e29b-41d4-a716-446655440003'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Already enrolled');
    });
  });

  describe('GET /status/:enrollmentId', () => {
    it('should return 400 for invalid enrollmentId format', async () => {
      const response = await request(app)
        .get('/api/enrollment/status/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 404 for non-existent enrollment', async () => {
      // Mock database to return no enrollment
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      db.select.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/enrollment/status/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });

    it('should return enrollment status', async () => {
      const mockEnrollment = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        labId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'pending',
        progress: 25,
        enrolledAt: new Date().toISOString(),
      };

      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockEnrollment]),
      };
      db.select.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/enrollment/status/550e8400-e29b-41d4-a716-446655440001');

      expect(response.status).toBe(200);
      expect(response.body.enrollmentId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(response.body.enrollmentStatus).toBe('pending');
      expect(response.body.progress).toBe(25);
    });
  });

  describe('Error Handling', () => {
    it('should handle database transaction failures', async () => {
      // Mock transaction to throw error
      db.transaction.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440002',
          labId: '550e8400-e29b-41d4-a716-446655440003'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle Kafka failures gracefully', async () => {
      // Mock successful database operations
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No existing enrollment
      };
      db.select.mockReturnValue(mockQuery);

      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          labId: '550e8400-e29b-41d4-a716-446655440003',
          status: 'pending'
        }]),
      };
      db.insert.mockReturnValue(mockInsert);

      // Mock Kafka failure
      kafkaProducerService.enrollLab.mockRejectedValue(new Error('Kafka connection failed'));

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440002',
          labId: '550e8400-e29b-41d4-a716-446655440003'
        });

      expect(response.status).toBe(201); // Still succeeds even with Kafka failure
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('queued');
    });
  });
});
