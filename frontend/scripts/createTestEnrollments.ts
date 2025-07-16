import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { labEnrollments, labs, users } from '../src/db/schemas';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function createTestEnrollments() {
  const connection = postgres(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('🎓 Creating test lab enrollments...');

  try {
    // First, let's see what users exist
    const existingUsers = await db.select().from(users).limit(5);
    console.log('Found users:', existingUsers.map(u => ({ id: u.id, email: u.email })));

    // If no users exist, create a test user
    let testUserId = existingUsers.length > 0 ? existingUsers[0].id : null;

    if (!testUserId) {
      const testUserData = {
        id: uuidv4(),
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const, // Fix the role type
      };

      await db.insert(users).values(testUserData);
      testUserId = testUserData.id;
      console.log('✅ Created test user:', testUserData.email);
    }

    // Get available labs
    const availableLabs = await db.select().from(labs);
    console.log('Found labs:', availableLabs.map(l => ({ id: l.id, name: l.name })));

    // Create enrollments for available labs
    const enrollments = availableLabs.map(lab => ({
      id: uuidv4(),
      userId: testUserId!,
      labId: lab.id,
      enrolledAt: new Date(),
      progress: 0,
      status: 'enrolled' as const,
    }));

    // Delete existing enrollments for this user to avoid conflicts
    await db.delete(labEnrollments).where(eq(labEnrollments.userId, testUserId!));

    // Insert new enrollments
    if (enrollments.length > 0) {
      await db.insert(labEnrollments).values(enrollments);
      console.log(`✅ Created ${enrollments.length} test enrollments for user ${testUserId}`);
    }

    console.log('🎉 Test enrollments created successfully!');
  } catch (error) {
    console.error('❌ Failed to create test enrollments:');
    console.error(error);
  } finally {
    await connection.end();
  }
}

createTestEnrollments();
