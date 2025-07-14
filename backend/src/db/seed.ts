import { db, closeConnection } from './index';
import { users } from './schemas/UserSchema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Insert sample users
    await db.insert(users).values([
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@ezshell.lab',
        role: 'admin',
      },
      {
        id: '2',
        name: 'Manager User',
        email: 'manager@ezshell.lab',
        role: 'manager',
      },
      {
        id: '3',
        name: 'Regular User',
        email: 'user@ezshell.lab',
        role: 'user',
      },
    ]);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed!');
    console.error(error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

seed();
