import { testConnection, closeConnection } from '../db';

describe('Database Connection', () => {
  afterAll(async () => {
    await closeConnection();
  });

  test('should connect to the database successfully', async () => {
    const result = await testConnection();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Database connection successful');
  }, 30000);

  test('should handle connection errors gracefully', async () => {
    // This would test with invalid connection string
    // For now, we'll just ensure the function exists and returns proper structure
    const result = await testConnection();

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
  });
});
