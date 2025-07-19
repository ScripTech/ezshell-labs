import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { createLogger } from './logger';

const logger = createLogger('ssh-key-manager');

// SSH Key management interface
export interface SSHKeyPair {
  publicKey: string;
  privateKey: string;
  keyPairName: string;
  filePath: string;
}

// SSH Key manager class
export class SSHKeyManager {
  private keyDir: string;
  private permissions: number;

  constructor() {
    this.keyDir = process.env.SSH_KEY_DIR || '/tmp/ssh-keys';
    this.permissions = parseInt(process.env.SSH_KEY_PERMISSIONS || '0600', 8);
  }

  /**
   * Initialize the SSH key directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.keyDir, { recursive: true, mode: 0o755 });
      logger.info('SSH key directory initialized', { directory: this.keyDir });
    } catch (error) {
      logger.error('Failed to initialize SSH key directory', {
        directory: this.keyDir,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate a unique key pair name
   */
  generateKeyPairName(userId: string, labId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ezshell-${userId}-${labId}-${timestamp}-${random}`;
  }

  /**
   * Save private key to temporary file with secure permissions
   */
  async savePrivateKey(keyPairName: string, privateKey: string): Promise<string> {
    const filePath = join(this.keyDir, `${keyPairName}.pem`);

    try {
      // Write private key to file
      await fs.writeFile(filePath, privateKey, { mode: this.permissions });

      // Verify file permissions
      const stats = await fs.stat(filePath);
      const actualMode = stats.mode & parseInt('777', 8);

      if (actualMode !== (this.permissions & parseInt('777', 8))) {
        logger.warn('Private key file permissions mismatch', {
          expected: this.permissions.toString(8),
          actual: actualMode.toString(8),
          filePath,
        });
      }

      logger.info('Private key saved securely', {
        keyPairName,
        filePath,
        permissions: actualMode.toString(8),
      });

      return filePath;
    } catch (error) {
      logger.error('Failed to save private key', {
        keyPairName,
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Read private key from file
   */
  async readPrivateKey(filePath: string): Promise<string> {
    try {
      const privateKey = await fs.readFile(filePath, 'utf8');
      logger.debug('Private key read successfully', { filePath });
      return privateKey;
    } catch (error) {
      logger.error('Failed to read private key', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete private key file
   */
  async deletePrivateKey(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info('Private key file deleted', { filePath });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error('Failed to delete private key file', {
          filePath,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
      // File doesn't exist, which is fine
      logger.debug('Private key file does not exist (already deleted)', { filePath });
    }
  }

  /**
   * Generate hash of private key for verification
   */
  generatePrivateKeyHash(privateKey: string): string {
    return createHash('sha256').update(privateKey).digest('hex');
  }

  /**
   * Clean up expired key files
   */
  async cleanupExpiredKeys(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.keyDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of files) {
        if (file.endsWith('.pem')) {
          const filePath = join(this.keyDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtimeMs < cutoffTime) {
            await this.deletePrivateKey(filePath);
            logger.info('Cleaned up expired key file', {
              file,
              age: `${Math.round((Date.now() - stats.mtimeMs) / (60 * 60 * 1000))}h`,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired keys', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List all key files
   */
  async listKeyFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.keyDir);
      return files.filter(file => file.endsWith('.pem'));
    } catch (error) {
      logger.error('Failed to list key files', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get key file stats
   */
  async getKeyFileStats(keyPairName: string): Promise<{ exists: boolean; size?: number; mtime?: Date }> {
    const filePath = join(this.keyDir, `${keyPairName}.pem`);

    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        mtime: stats.mtime,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { exists: false };
      }
      throw error;
    }
  }

  /**
   * Validate private key format
   */
  validatePrivateKey(privateKey: string): boolean {
    // Basic validation for PEM format
    const pemRegex = /-----BEGIN RSA PRIVATE KEY-----[\s\S]*-----END RSA PRIVATE KEY-----/;
    const sshRegex = /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]*-----END OPENSSH PRIVATE KEY-----/;

    return pemRegex.test(privateKey) || sshRegex.test(privateKey);
  }

  /**
   * Get key directory path
   */
  getKeyDirectory(): string {
    return this.keyDir;
  }

  /**
   * Get key file path
   */
  getKeyFilePath(keyPairName: string): string {
    return join(this.keyDir, `${keyPairName}.pem`);
  }
}

// Export singleton instance
export const sshKeyManager = new SSHKeyManager();
