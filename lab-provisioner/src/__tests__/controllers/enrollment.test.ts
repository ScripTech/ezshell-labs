import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';

// Mock database implementation
const mockDb: any = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([]),
        orderBy: () => ({
          limit: () => ({
            offset: () => Promise.resolve([]),
          }),
        }),
      }),
      leftJoin: () => ({
        leftJoin: () => ({
          limit: () => ({
            offset: () => ({
              orderBy: () => Promise.resolve([]),
            }),
          }),
        }),
      }),
    }),
  }),
  insert: () => ({
    values: () => Promise.resolve(),
  }),
  update: () => ({
    set: () => ({
      where: () => Promise.resolve(),
    }),
  }),
  transaction: (callback: (tx: any) => Promise<any>) => callback(mockDb),
};

// Mock the database module
jest.mock('../../config/database', () => ({
  db: mockDb,
  labEnrollments: 'labEnrollments',
  labProvisions: 'labProvisions',
  provisioningQueue: 'provisioningQueue',
}));

// Mock the kafka producer service
const mockKafkaProducer = {
  enrollLab: jest.fn(),
};

jest.mock('../../services/kafka-producer', () => ({
  kafkaProducerService: mockKafkaProducer,
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Import after mocks
import { enrollmentRouter } from '../../controllers/enrollment';

// Test data storage
let testEnrollments: any[] = [];
let testQueueEntries: any[] = [];
let testProvisions: any[] = [];

describe('Enrollment Controller', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/enrollment', enrollmentRouter);
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset test data
    testEnrollments = [];
    testQueueEntries = [];
    testProvisions = [];

    // Setup mock implementations
    setupMockDatabase();
  });

  function setupMockDatabase() {
    // Mock select operations
    mockDb.select.mockReturnValue({
      from: jest.fn((table) => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => {
            if (table === 'labEnrollments') {
              return Promise.resolve(testEnrollments);
            } else if (table === 'provisioningQueue') {
              return Promise.resolve(testQueueEntries);
            } else if (table === 'labProvisions') {
              return Promise.resolve(testProvisions);
            }
            return Promise.resolve([]);
          }),
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              offset: jest.fn(() => Promise.resolve(testEnrollments)),
            })),
          })),
        })),
        leftJoin: jest.fn(() => ({
          leftJoin: jest.fn(() => ({
            limit: jest.fn(() => ({
              offset: jest.fn(() => ({
                orderBy: jest.fn(() => {
                  // Mock joined query results
                  const results = testEnrollments.map(enrollment => {
                    const queueEntry = testQueueEntries.find(q => q.enrollmentId === enrollment.id);
                    const provision = testProvisions.find(p => p.enrollmentId === enrollment.id);

                    return {
                      enrollmentId: enrollment.id,
                      userId: enrollment.userId,
                      labId: enrollment.labId,
                      status: enrollment.status,
                      progress: enrollment.progress,
                      enrolledAt: enrollment.enrolledAt,
                      completedAt: enrollment.completedAt,
                      provisioningStatus: queueEntry?.status,
                      instanceId: provision?.instanceId,
                      instanceState: provision?.instanceState,
                      publicIp: provision?.publicIp,
                    };
                  });

                  return Promise.resolve(results);
                }),
              })),
            })),
          })),
        })),
      })),
    });

    // Mock insert operations
    mockDb.insert.mockReturnValue({
      values: jest.fn((data) => {
        // Determine which table and add to appropriate array
        if (data.userId && data.labId && !data.enrollmentId) {
          // This is an enrollment
          testEnrollments.push({
            ...data,
            enrolledAt: data.enrolledAt || new Date().toISOString(),
          });
        } else if (data.enrollmentId && data.messageData) {
          // This is a queue entry
          testQueueEntries.push({
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        } else if (data.instanceId || data.enrollmentId) {
          // This is a provision
          testProvisions.push({
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        }
        return Promise.resolve();
      }),
    });

    // Mock update operations
    mockDb.update.mockReturnValue({
      set: jest.fn((data) => ({
        where: jest.fn(() => {
          // Find and update queue entry
          const index = testQueueEntries.findIndex(entry => entry.enrollmentId);
          if (index >= 0) {
            testQueueEntries[index] = { ...testQueueEntries[index], ...data };
          }
          return Promise.resolve();
        }),
      })),
    });
  }

  describe('POST /enroll', () => {
    const validEnrollmentData = {
      userId: uuidv4(),
      labId: uuidv4(),
    };

    it('should successfully enroll a user in a lab', async () => {
      const { kafkaProducerService } = require('../../services/kafka-producer');
      kafkaProducerService.enrollLab.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send(validEnrollmentData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Lab enrollment queued for provisioning',
        data: {
          userId: validEnrollmentData.userId,
          labId: validEnrollmentData.labId,
          status: 'queued',
        },
      });

      expect(response.body.data.enrollmentId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      // Verify database operations were called
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // enrollment + queue entry

      // Verify Kafka was called
      expect(kafkaProducerService.enrollLab).toHaveBeenCalledWith(
        validEnrollmentData.userId,
        validEnrollmentData.labId,
        response.body.data.enrollmentId
      );

      // Verify test data was created
      expect(testEnrollments).toHaveLength(1);
      expect(testQueueEntries).toHaveLength(1);

      const enrollment = testEnrollments[0];
      expect(enrollment.userId).toBe(validEnrollmentData.userId);
      expect(enrollment.labId).toBe(validEnrollmentData.labId);
      expect(enrollment.status).toBe('enrolled');
    });

    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({ labId: uuidv4() })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('userId'),
        ]),
      });
    });

    it('should return 400 for missing labId', async () => {
      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({ userId: uuidv4() })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('labId'),
        ]),
      });
    });

    it('should return 400 for invalid userId format', async () => {
      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({ userId: '', labId: uuidv4() })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
      });
    });

    it('should return 409 for duplicate enrollment', async () => {
      const { kafkaProducerService } = require('../../services/kafka-producer');
      kafkaProducerService.enrollLab.mockResolvedValue(undefined);

      // Setup existing enrollment
      testEnrollments.push({
        id: uuidv4(),
        userId: validEnrollmentData.userId,
        labId: validEnrollmentData.labId,
        status: 'enrolled',
        progress: 0,
        enrolledAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send(validEnrollmentData)
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Already enrolled',
        message: 'User is already enrolled in this lab',
      });

      expect(response.body.enrollmentId).toBeDefined();
    });

    it('should handle Kafka failure gracefully', async () => {
      const { kafkaProducerService } = require('../../services/kafka-producer');
      kafkaProducerService.enrollLab.mockRejectedValueOnce(new Error('Kafka connection failed'));

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send(validEnrollmentData)
        .expect(201);

      // Should still create enrollment record
      expect(response.body.success).toBe(true);
      expect(testEnrollments).toHaveLength(1);
      expect(testQueueEntries).toHaveLength(1);

      // Should have called update to mark as failed
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should handle database transaction failure', async () => {
      // Mock transaction to fail
      mockDb.transaction.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send(validEnrollmentData)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Internal server error',
        message: 'Failed to process enrollment request',
      });

      // Verify no records were created
      expect(testEnrollments).toHaveLength(0);
      expect(testQueueEntries).toHaveLength(0);
    });
  });

  describe('GET /status/:enrollmentId', () => {
    let enrollmentId: string;

    beforeEach(() => {
      enrollmentId = uuidv4();

      // Setup test data
      testEnrollments.push({
        id: enrollmentId,
        userId: uuidv4(),
        labId: uuidv4(),
        status: 'enrolled',
        progress: 0,
        enrolledAt: new Date().toISOString(),
      });

      testQueueEntries.push({
        id: uuidv4(),
        enrollmentId,
        userId: testEnrollments[0].userId,
        labId: testEnrollments[0].labId,
        status: 'queued',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    it('should return enrollment status', async () => {
      const response = await request(app)
        .get(`/api/enrollment/status/${enrollmentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        enrollmentId,
        enrollmentStatus: 'enrolled',
        progress: 0,
        provisioning: {
          status: 'queued',
          attempts: 0,
          maxAttempts: 3,
        },
        instance: null,
      });

      expect(response.body.userId).toBeDefined();
      expect(response.body.labId).toBeDefined();
      expect(response.body.enrolledAt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 for non-existent enrollment', async () => {
      const nonExistentId = uuidv4();

      // Clear test data so nothing is found
      testEnrollments = [];

      const response = await request(app)
        .get(`/api/enrollment/status/${nonExistentId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not found',
        message: 'Enrollment not found',
      });
    });

    it('should return 400 for invalid enrollmentId format', async () => {
      const response = await request(app)
        .get('/api/enrollment/status/invalid-uuid')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
      });
    });

    it('should include provision details when available', async () => {
      // Add provision data
      testProvisions.push({
        id: uuidv4(),
        enrollmentId,
        instanceId: 'i-1234567890abcdef0',
        publicIp: '1.2.3.4',
        privateIp: '10.0.1.100',
        instanceState: 'running',
        keyPairName: 'lab-keypair-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/enrollment/status/${enrollmentId}`)
        .expect(200);

      expect(response.body.instance).toMatchObject({
        instanceId: 'i-1234567890abcdef0',
        publicIp: '1.2.3.4',
        privateIp: '10.0.1.100',
        state: 'running',
        keyPairName: 'lab-keypair-123',
      });
    });
  });

  describe('GET /list', () => {
    beforeEach(() => {
      // Create multiple test enrollments
      for (let i = 0; i < 5; i++) {
        const enrollmentId = uuidv4();
        const userId = uuidv4();
        const labId = uuidv4();

        testEnrollments.push({
          id: enrollmentId,
          userId,
          labId,
          status: 'enrolled',
          progress: 0,
          enrolledAt: new Date().toISOString(),
        });

        testQueueEntries.push({
          id: uuidv4(),
          enrollmentId,
          userId,
          labId,
          status: 'queued',
          attempts: 0,
          maxAttempts: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    it('should list enrollments with default pagination', async () => {
      const response = await request(app)
        .get('/api/enrollment/list')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 5,
      });
    });

    it('should support custom pagination', async () => {
      const response = await request(app)
        .get('/api/enrollment/list?page=2&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(5); // Mock returns all for simplicity
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 2,
        total: 5,
      });
    });

    it('should include enrollment and provisioning status', async () => {
      const response = await request(app)
        .get('/api/enrollment/list')
        .expect(200);

      const enrollment = response.body.data[0];
      expect(enrollment).toMatchObject({
        enrollmentId: expect.any(String),
        userId: expect.any(String),
        labId: expect.any(String),
        status: 'enrolled',
        progress: 0,
        provisioningStatus: 'queued',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      mockDb.select.mockRejectedValueOnce(new Error('Database connection lost'));

      const response = await request(app)
        .get('/api/enrollment/list')
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Internal server error',
        message: 'Failed to list enrollments',
      });
    });

    it('should validate request parameters correctly', async () => {
      const response = await request(app)
        .post('/api/enrollment/enroll')
        .send({
          userId: 'a'.repeat(500), // Too long
          labId: uuidv4(),
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
