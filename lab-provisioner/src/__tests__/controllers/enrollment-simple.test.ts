import request from 'supertest';
import express from 'express';

// Simple test to verify Jest is working
describe('Test Environment', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Simple test route
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  });

  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should be able to make HTTP requests', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});

// Basic enrollment controller test
describe('Enrollment API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock enrollment endpoint
    app.post('/api/enrollment/enroll', (req, res) => {
      const { userId, labId } = req.body;

      if (!userId || !labId) {
        return res.status(400).json({
          error: 'Validation failed',
          details: ['userId is required', 'labId is required']
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Lab enrollment queued for provisioning',
        data: {
          enrollmentId: 'test-enrollment-id',
          userId,
          labId,
          status: 'queued'
        }
      });
    });
  });

  it('should successfully create an enrollment', async () => {
    const enrollmentData = {
      userId: 'test-user-id',
      labId: 'test-lab-id'
    };

    const response = await request(app)
      .post('/api/enrollment/enroll')
      .send(enrollmentData)
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Lab enrollment queued for provisioning',
      data: {
        enrollmentId: 'test-enrollment-id',
        userId: 'test-user-id',
        labId: 'test-lab-id',
        status: 'queued'
      }
    });
  });

  it('should return 400 for missing userId', async () => {
    const response = await request(app)
      .post('/api/enrollment/enroll')
      .send({ labId: 'test-lab-id' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Validation failed'
    });
  });

  it('should return 400 for missing labId', async () => {
    const response = await request(app)
      .post('/api/enrollment/enroll')
      .send({ userId: 'test-user-id' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Validation failed'
    });
  });
});
