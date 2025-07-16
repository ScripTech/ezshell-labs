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
        labId: 'ex200',
        name: 'RedHat EX200 Lab',
        description: 'Practice environment for RHCSA certification. Master essential Linux administration skills including user management, file systems, and service configuration.',
        duration: 120,
        imageUrl: '/images/labs/rhcsa.svg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ex280',
        labId: 'ex280',
        name: 'OpenShift Administration I',
        description: 'Learn to build and manage OpenShift clusters. Perfect for aspiring OpenShift administrators and DevOps engineers.',
        duration: 180,
        imageUrl: '/images/labs/openshift.svg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'k8s-basics',
        labId: 'k8s-basics',
        name: 'Kubernetes Fundamentals',
        description: 'Hands-on Kubernetes training environment. Deploy applications, manage pods, and learn container orchestration.',
        duration: 90,
        imageUrl: '/images/labs/kubernetes.svg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ansible-essentials',
        labId: 'ansible-essentials',
        name: 'Ansible Automation',
        description: 'Master Ansible automation with practical exercises. Create playbooks, manage inventory, and automate common tasks.',
        duration: 60,
        imageUrl: '/images/labs/ansible.svg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'linux-networking',
        labId: 'linux-networking',
        name: 'Linux Networking Fundamentals',
        description: 'Deep dive into Linux networking concepts. Configure interfaces, routing, and network services.',
        duration: 90,
        imageUrl: '/images/labs/networking.svg',
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
