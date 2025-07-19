import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 60, // Connection timeout in seconds
});

// Create Drizzle ORM instance with schema
export const db = drizzle(client, { schema });

// Export schema types for use in other files
export * from '../models/schema';

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await client.end();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};
