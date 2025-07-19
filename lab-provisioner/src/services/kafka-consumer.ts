import { ConsumerGroup } from 'kafka-node';
import { eq } from 'drizzle-orm';
import {
  getKafkaConfig,
  createKafkaConsumerGroup,
  EnrollmentMessage,
  validateEnrollmentMessage,
  handleKafkaError
} from '../config/kafka';
import { db, provisioningQueue, labProvisions, sshKeys } from '../config/database';
import { awsProvisionerService } from './aws-provisioner';
import { sshKeyManager } from '../utils/ssh-key-manager';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('kafka-consumer');

export class KafkaConsumerService {
  private consumer: ConsumerGroup;
  private config = getKafkaConfig();
  private isRunning = false;

  constructor() {
    this.consumer = createKafkaConsumerGroup(this.config);
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for consumer
   */
  private setupEventHandlers(): void {
    this.consumer.on('message', (message) => {
      this.handleMessage(message).catch((error) => {
        logger.error('Error handling message', {
          error: error instanceof Error ? error.message : String(error),
          offset: message.offset,
          partition: message.partition,
        });
      });
    });

    this.consumer.on('error', (error) => {
      handleKafkaError(error, 'consumer');
    });

    this.consumer.on('connect', () => {
      this.isRunning = true;
      logger.info('Kafka consumer connected', {
        topic: this.config.topic,
        consumerGroup: this.config.consumerGroup,
      });
    });

    this.consumer.on('rebalanced', () => {
      logger.info('Kafka consumer rebalanced');
    });
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(message: any): Promise<void> {
    try {
      logger.debug('Received Kafka message', {
        topic: message.topic,
        partition: message.partition,
        offset: message.offset,
      });

      // Parse message
      let enrollmentMessage: EnrollmentMessage;
      try {
        enrollmentMessage = JSON.parse(message.value);
      } catch (parseError) {
        logger.error('Failed to parse message JSON', {
          message: message.value,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        return;
      }

      // Validate message structure
      if (!validateEnrollmentMessage(enrollmentMessage)) {
        logger.error('Invalid enrollment message format', {
          message: enrollmentMessage,
        });
        return;
      }

      logger.info('Processing enrollment message', {
        enrollmentId: enrollmentMessage.enrollmentId,
        userId: enrollmentMessage.userId,
        labId: enrollmentMessage.labId,
        messageId: enrollmentMessage.messageId,
      });

      // Process the enrollment
      await this.processEnrollment(enrollmentMessage);

    } catch (error) {
      logger.error('Error in message handler', {
        error: error instanceof Error ? error.message : String(error),
        message: message.value,
      });
    }
  }

  /**
   * Process enrollment message and provision resources
   */
  private async processEnrollment(message: EnrollmentMessage): Promise<void> {
    const { enrollmentId, userId, labId } = message;

    try {
      // Update queue status to processing
      await db
        .update(provisioningQueue)
        .set({
          status: 'processing',
          processedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(provisioningQueue.enrollmentId, enrollmentId));

      logger.info('Starting lab provisioning', {
        enrollmentId,
        userId,
        labId,
      });

      // Check if provision already exists
      const existingProvision = await db
        .select()
        .from(labProvisions)
        .where(eq(labProvisions.enrollmentId, enrollmentId))
        .limit(1);

      if (existingProvision.length > 0) {
        logger.warn('Provision already exists for enrollment', {
          enrollmentId,
          provisionId: existingProvision[0].id,
          instanceId: existingProvision[0].instanceId,
        });
        return;
      }

      // Provision AWS resources
      const provisionResult = await awsProvisionerService.launchLabInstance(
        userId,
        labId,
        enrollmentId
      );

      // Create provision record
      const provisionId = uuidv4();
      await db.insert(labProvisions).values({
        id: provisionId,
        enrollmentId,
        instanceId: provisionResult.instanceId,
        privateIp: provisionResult.privateIp,
        keyPairName: provisionResult.keyPairName,
        instanceState: provisionResult.state as "pending" | "running" | "stopping" | "stopped" | "terminated" | "shutting-down",
        provisionedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Store SSH key information
      const privateKeyHash = sshKeyManager.generatePrivateKeyHash(
        await sshKeyManager.readPrivateKey(provisionResult.privateKeyPath)
      );

      await db.insert(sshKeys).values({
        id: uuidv4(),
        provisionId,
        keyPairName: provisionResult.keyPairName,
        privateKeyHash,
        filePath: provisionResult.privateKeyPath,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      });

      logger.info('Instance launched, waiting for running state', {
        enrollmentId,
        instanceId: provisionResult.instanceId,
        keyPairName: provisionResult.keyPairName,
      });

      // Wait for instance to be running and get public IP
      const instanceDetails = await awsProvisionerService.waitForInstanceRunning(
        provisionResult.instanceId,
        parseInt(process.env.PROVISIONING_TIMEOUT || '300000')
      );

      // Update provision with public IP
      await db
        .update(labProvisions)
        .set({
          publicIp: instanceDetails.publicIp,
          instanceState: 'running',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(labProvisions.id, provisionId));

      // Update queue status to completed
      await db
        .update(provisioningQueue)
        .set({
          status: 'completed',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(provisioningQueue.enrollmentId, enrollmentId));

      logger.info('Lab provisioning completed successfully', {
        enrollmentId,
        instanceId: provisionResult.instanceId,
        publicIp: instanceDetails.publicIp,
        privateIp: instanceDetails.privateIp,
        keyPairName: provisionResult.keyPairName,
      });

    } catch (error) {
      await this.handleProvisioningError(enrollmentId, error);
    }
  }

  /**
   * Handle provisioning errors
   */
  private async handleProvisioningError(enrollmentId: string, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Provisioning failed', {
      enrollmentId,
      error: errorMessage,
    });

    try {
      // Get current queue entry
      const queueEntry = await db
        .select()
        .from(provisioningQueue)
        .where(eq(provisioningQueue.enrollmentId, enrollmentId))
        .limit(1);

      if (queueEntry.length === 0) {
        logger.error('Queue entry not found for failed provisioning', { enrollmentId });
        return;
      }

      const entry = queueEntry[0];
      const newAttempts = (entry.attempts || 0) + 1;
      const maxAttempts = entry.maxAttempts || 3;

      if (newAttempts >= maxAttempts) {
        // Mark as failed permanently
        await db
          .update(provisioningQueue)
          .set({
            status: 'failed',
            attempts: newAttempts,
            lastError: errorMessage,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(provisioningQueue.enrollmentId, enrollmentId));

        logger.error('Provisioning failed permanently after max attempts', {
          enrollmentId,
          attempts: newAttempts,
          maxAttempts,
          finalError: errorMessage,
        });
      } else {
        // Mark for retry
        await db
          .update(provisioningQueue)
          .set({
            status: 'queued',
            attempts: newAttempts,
            lastError: errorMessage,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(provisioningQueue.enrollmentId, enrollmentId));

        logger.warn('Provisioning will be retried', {
          enrollmentId,
          attempts: newAttempts,
          maxAttempts,
          error: errorMessage,
        });
      }
    } catch (dbError) {
      logger.error('Failed to update queue after provisioning error', {
        enrollmentId,
        originalError: errorMessage,
        dbError: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }
  }

  /**
   * Start consuming messages
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Consumer is already running');
      return;
    }

    logger.info('Starting Kafka consumer', {
      topic: this.config.topic,
      consumerGroup: this.config.consumerGroup,
    });

    // Consumer starts automatically when created
    this.isRunning = true;
  }

  /**
   * Stop consuming messages
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Consumer is not running');
      return;
    }

    logger.info('Stopping Kafka consumer...');

    return new Promise((resolve) => {
      this.consumer.close(true, (error) => {
        if (error) {
          logger.error('Error closing consumer', {
            error: error.message,
          });
        } else {
          logger.info('Kafka consumer stopped');
        }

        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * Check if consumer is running
   */
  isConsumerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get consumer statistics
   */
  getStats(): any {
    return {
      isRunning: this.isRunning,
      topic: this.config.topic,
      consumerGroup: this.config.consumerGroup,
      brokerHost: this.config.brokerHost,
    };
  }
}

// Export singleton instance
export const kafkaConsumerService = new KafkaConsumerService();
