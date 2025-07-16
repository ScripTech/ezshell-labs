import request from 'supertest';
import express from 'express';
import apiRoutes from '../routes/api';
import { closeConnection } from '../db';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Endpoints', () => {
  afterAll(async () => {
    await closeConnection();
  });

  describe('GET /api/health', () => {
    test('should return database health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Database connection successful');
    });
  });

  describe('GET /api/users', () => {
    test('should return list of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user', async () => {
      const newUser = {
        id: `test-api-user-${Date.now()}`,
        name: 'Test API User',
        email: `test-api-${Date.now()}@test.com`,
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject(newUser);

      // Clean up
      await request(app)
        .delete(`/api/users/${newUser.id}`)
        .expect(200);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user by ID if exists', async () => {
      // First get all users to get a valid ID
      const usersResponse = await request(app)
        .get('/api/users')
        .expect(200);

      if (usersResponse.body.data.length > 0) {
        const userId = usersResponse.body.data[0].id;

        const response = await request(app)
          .get(`/api/users/${userId}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data.id).toBe(userId);
      }
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });
});
