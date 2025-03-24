import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { labs } from './schemas';

dotenv.config();

async function seed() {
  const connection = postgres(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('🌱 Seeding database...');

  try {
    await db.delete(labs);
    await db.insert(labs).values([
      {
        id: 'ex200',
        name: 'RedHat EX200 Lab',
        description: 'Practice environment for RHCSA certification. Master essential Linux administration skills including user management, file systems, and service configuration.',
        duration: 120,
        imageUrl: '/images/labs/rhcsa.svg',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
    console.log('✅ Seed completed!');
  } catch (error) {
    console.error('❌ Seed failed!');
    console.error(error);
  } finally {
    await connection.end();
  }
}

seed();
