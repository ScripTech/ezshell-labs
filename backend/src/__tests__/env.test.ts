import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Environment Variables', () => {
  test('should load DATABASE_URL', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain('postgres://');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
  });

  test('should load POSTGRES credentials', () => {
    expect(process.env.POSTGRES_HOST).toBe('localhost');
    expect(process.env.POSTGRES_USER).toBe('ezshell-user');
    expect(process.env.POSTGRES_PASSWORD).toBe('ezshell-password');
    expect(process.env.POSTGRES_DB).toBe('ezshell-db');
    expect(process.env.POSTGRES_PORT).toBe('5434');
  });
});
