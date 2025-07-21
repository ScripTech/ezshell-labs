import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

// Lab provisioning types (matching lab-provisioner schema)
export interface LabProvision {
  id: string;
  enrollmentId: string;
  instanceId: string | null;
  publicIp: string | null;
  privateIp: string | null;
  keyPairName: string | null;
  instanceState: 'pending' | 'running' | 'stopping' | 'stopped' | 'terminated' | 'shutting-down';
  provisionedAt: string | null;
  terminatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SshKey {
  id: string;
  provisionId: string;
  publicKey: string | null;
  privateKeyHash: string | null;
  keyPairName: string;
  filePath: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface LabEnrollment {
  id: string;
  userId: string | null;
  labId: string | null;
  enrolledAt: string;
  completedAt: string | null;
  progress: number;
  status: string;
}

export interface LabConnectionDetails {
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
  keyPairName: string;
  instanceState: string;
}

/**
 * Lab Provisioning Service
 *
 * Manages database connections and queries for lab provisioning data.
 *
 * Environment Variables:
 * - DATABASE_URL: PostgreSQL connection string (required)
 * - LAB_SSH_USERNAME: Default SSH username for lab instances (default: "ubuntu")
 * - LAB_SSH_PASSWORD: Fallback password for SSH connections (optional)
 */
export class LabProvisioningService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  /**
   * Get lab connection details by lab ID and user ID
   */
  async getLabConnectionDetails(labId: string, userId: string): Promise<LabConnectionDetails | null> {
    try {
      // Query using drizzle with sql template
      const result = await this.db.execute(sql`
        SELECT
          lp.public_ip as host,
          lp.instance_state,
          lp.key_pair_name,
          sk.file_path as private_key_path
        FROM lab_enrollments le
        JOIN lab_provisions lp ON le.id = lp.enrollment_id
        LEFT JOIN ssh_keys sk ON lp.id = sk.provision_id
        WHERE le."labId" = ${labId}
          AND le."userId" = ${userId}
          AND lp.instance_state = 'running'
          AND lp.public_ip IS NOT NULL
        ORDER BY lp.created_at DESC
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log(`No running lab instance found for lab ${labId} and user ${userId}`);
        return null;
      }

      const row = result[0] as any;

      if (!row.host) {
        console.log(`Lab instance found but no public IP available for lab ${labId}`);
        return null;
      }

      return {
        host: row.host,
        port: 22, // Standard SSH port
        username: process.env.LAB_SSH_USERNAME || "ubuntu", // Configurable AWS EC2 user
        privateKeyPath: row.private_key_path || "",
        keyPairName: row.key_pair_name || "",
        instanceState: row.instance_state,
      };
    } catch (error) {
      console.error('Error fetching lab connection details:', error);
      return null;
    }
  }

  /**
   * Get lab connection details by enrollment ID (alternative method)
   */
  async getLabConnectionDetailsByEnrollment(enrollmentId: string): Promise<LabConnectionDetails | null> {
    try {
      const result = await this.db.execute(sql`
        SELECT
          lp.instance_id,
          lp.public_ip as host,
          lp.instance_state,
          lp.key_pair_name,
          sk.file_path as private_key_path
        FROM lab_provisions lp
        LEFT JOIN ssh_keys sk ON lp.id = sk.provision_id
        WHERE lp.enrollment_id = ${enrollmentId}
          AND lp.instance_state = 'running'
          AND lp.public_ip IS NOT NULL
        ORDER BY lp.created_at DESC
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log(`No running lab instance found for enrollment ${enrollmentId}`);
        return null;
      }

      const row = result[0] as any;

      return {
        host: row.host,
        port: 22,
        username: process.env.LAB_SSH_USERNAME || 'ubuntu',
        privateKeyPath: row.private_key_path || '',
        keyPairName: row.key_pair_name || '',
        instanceState: row.instance_state
      };
    } catch (error) {
      console.error('Error fetching lab connection details by enrollment:', error);
      return null;
    }
  }

  /**
   * Check if a lab instance is ready for connection
   */
  async isLabReady(labId: string, userId: string): Promise<boolean> {
    const details = await this.getLabConnectionDetails(labId, userId);
    return details !== null && details.instanceState === 'running' && details.host !== '';
  }

  /**
   * Get all running instances for a user (for debugging/admin purposes)
   */
  async getUserRunningInstances(userId: string): Promise<LabConnectionDetails[]> {
    try {
      const result = await this.db.execute(sql`
        SELECT
          lp.public_ip as host,
          lp.instance_state,
          lp.key_pair_name,
          sk.file_path as private_key_path,
          le."labId"
        FROM lab_enrollments le
        JOIN lab_provisions lp ON le.id = lp.enrollment_id
        LEFT JOIN ssh_keys sk ON lp.id = sk.provision_id
        WHERE le."userId" = ${userId}
          AND lp.instance_state = 'running'
          AND lp.public_ip IS NOT NULL
        ORDER BY lp.created_at DESC
      `);

      return result.map((row: any) => ({
        host: row.host,
        port: 22,
        username: process.env.LAB_SSH_USERNAME || "ubuntu",
        privateKeyPath: row.private_key_path || "",
        keyPairName: row.key_pair_name || "",
        instanceState: row.instance_state,
      }));
    } catch (error) {
      console.error('Error fetching user running instances:', error);
      return [];
    }
  }
}

// Export singleton instance
export const labProvisioningService = new LabProvisioningService();
