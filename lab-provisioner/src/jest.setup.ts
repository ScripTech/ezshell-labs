// Jest setup file for lab-provisioner tests
import 'jest';

// Setup global test environment
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_lab_provisioner';
process.env.KAFKA_BROKER_URL = 'localhost:9092';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Global test helpers
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
