import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schemas'
import dotenv from 'dotenv'

// Ensure environment variables are loaded
dotenv.config()

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const client = postgres(connectionString)
export const db = drizzle(client, { schema })

// Connection test function
export async function testConnection() {
  try {
    await client`SELECT 1 as test`
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { success: false, message: `Database connection failed: ${error}` }
  }
}

// Graceful shutdown
export async function closeConnection() {
  await client.end()
}
