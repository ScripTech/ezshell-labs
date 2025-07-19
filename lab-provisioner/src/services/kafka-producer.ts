import { Producer, KafkaClient } from 'kafka-node';
import {
  getKafkaConfig,
  createKafkaClient,
  createKafkaProducer,
  testKafkaConnection,
  EnrollmentMessage,
  ProvisioningStatusMessage,
  handleKafkaError
} from '../config/kafka';
import { createLogger } from '../utils/logger';

const logger = createLogger('kafka-producer');

export class KafkaProducerService {
  private client: KafkaClient | null = null;
  private producer: Producer | null = null;
  private isReady: boolean = false;
  private isEnabled: boolean = true;
  private config = getKafkaConfig();

  constructor() {
    this.isEnabled = this.config.enabled;

    if (!this.isEnabled) {
      logger.info('Kafka is disabled, running without message publishing');
    }
  }

  /**
   * Initialize Kafka with connection testing
   */
  async initialize(): Promise<void> {
    if (!this.isEnabled) {
      logger.info('Kafka is disabled, skipping producer initialization');
      return;
    }

    try {
      logger.info('Testing Kafka connection...', { broker: this.config.brokerHost });

      const isConnected = await testKafkaConnection(this.config.brokerHost);

      if (!isConnected) {
        logger.warn('Kafka broker is not available, disabling Kafka functionality', {
          broker: this.config.brokerHost,
        });
        this.isEnabled = false;
        return;
      }

      logger.info('Kafka connection test successful, initializing producer', {
        broker: this.config.brokerHost,
      });

      this.client = createKafkaClient(this.config);
      this.producer = createKafkaProducer(this.client);
      this.setupEventHandlers();

    } catch (error) {
      logger.error('Failed to initialize Kafka producer, disabling Kafka functionality', {
        error: error instanceof Error ? error.message : String(error),
        broker: this.config.brokerHost,
      });
      this.isEnabled = false;
      this.client = null;
      this.producer = null;
    }
  }  /**
   * Setup event handlers for producer
   */
  private setupEventHandlers(): void {
    if (!this.producer || !this.client) {
      return;
    }

    this.producer.on('ready', () => {
      this.isReady = true;
      logger.info('Kafka producer is ready', {
        broker: this.config.brokerHost,
        clientId: this.config.clientId,
      });
    });

    this.producer.on('error', (error) => {
      this.isReady = false;
      handleKafkaError(error, 'producer');
    });

    this.client.on('error', (error) => {
      handleKafkaError(error, 'client');
    });

    this.client.on('connect', () => {
      logger.info('Kafka client connected', { broker: this.config.brokerHost });
    });

    this.client.on('reconnect', () => {
      logger.info('Kafka client reconnected', { broker: this.config.brokerHost });
    });
  }

  /**
   * Wait for producer to be ready
   */
  async waitForReady(timeoutMs: number = 10000): Promise<void> {
    if (!this.isEnabled || !this.producer) {
      throw new Error('Kafka producer is disabled or not initialized');
    }

    return new Promise((resolve, reject) => {
      if (this.isReady) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Kafka producer not ready within ${timeoutMs}ms`));
      }, timeoutMs);

      const readyHandler = () => {
        clearTimeout(timeout);
        if (this.producer) {
          this.producer.removeListener('ready', readyHandler);
        }
        resolve();
      };

      if (this.producer) {
        this.producer.on('ready', readyHandler);
      } else {
        clearTimeout(timeout);
        reject(new Error('Kafka producer is not initialized'));
      }
    });
  }

  /**
   * Publish enrollment message to Kafka
   */
  async publishEnrollmentMessage(message: EnrollmentMessage): Promise<void> {
    if (!this.isEnabled) {
      logger.info('Kafka is disabled, skipping enrollment message publication', {
        messageId: message.messageId,
        enrollmentId: message.enrollmentId,
      });
      return;
    }

    try {
      await this.waitForReady();

      if (!this.producer) {
        throw new Error('Kafka producer is not initialized');
      }

      const payload = [
        {
          topic: this.config.topic,
          messages: JSON.stringify(message),
          partition: 0, // Use partition 0 for simplicity
          attributes: 0, // No compression
        },
      ];

      return new Promise((resolve, reject) => {
        this.producer!.send(payload, (error, data) => {
          if (error) {
            logger.error('Failed to publish enrollment message', {
              error: error.message,
              message: message,
              topic: this.config.topic,
            });
            reject(error);
          } else {
            logger.info('Enrollment message published successfully', {
              topic: this.config.topic,
              messageId: message.messageId,
              enrollmentId: message.enrollmentId,
              offset: data,
            });
            resolve();
          }
        });
      });
    } catch (error) {
      logger.error('Error publishing enrollment message', {
        error: error instanceof Error ? error.message : String(error),
        message: message,
      });
      throw error;
    }
  }

  /**
   * Publish provisioning status update
   */
  async publishProvisioningStatus(message: ProvisioningStatusMessage): Promise<void> {
    if (!this.isEnabled) {
      logger.info('Kafka is disabled, skipping provisioning status publication', {
        enrollmentId: message.enrollmentId,
        status: message.status,
      });
      return;
    }

    try {
      await this.waitForReady();

      if (!this.producer) {
        throw new Error('Kafka producer is not initialized');
      }

      const statusTopic = `${this.config.topic}-status`;
      const payload = [
        {
          topic: statusTopic,
          messages: JSON.stringify(message),
          partition: 0,
          attributes: 0,
        },
      ];

      return new Promise((resolve, reject) => {
        this.producer!.send(payload, (error, data) => {
          if (error) {
            logger.error('Failed to publish provisioning status', {
              error: error.message,
              message: message,
              topic: statusTopic,
            });
            reject(error);
          } else {
            logger.info('Provisioning status published successfully', {
              topic: statusTopic,
              enrollmentId: message.enrollmentId,
              status: message.status,
              offset: data,
            });
            resolve();
          }
        });
      });
    } catch (error) {
      logger.error('Error publishing provisioning status', {
        error: error instanceof Error ? error.message : String(error),
        message: message,
      });
      throw error;
    }
  }

  /**
   * Create enrollment message and publish
   */
  async enrollLab(userId: string, labId: string, enrollmentId: string): Promise<void> {
    const message: EnrollmentMessage = {
      userId,
      labId,
      enrollmentId,
      timestamp: new Date().toISOString(),
      messageId: `${enrollmentId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };

    await this.publishEnrollmentMessage(message);
  }

  /**
   * Update provisioning status
   */
  async updateProvisioningStatus(
    enrollmentId: string,
    status: ProvisioningStatusMessage['status'],
    additionalData?: Partial<ProvisioningStatusMessage>
  ): Promise<void> {
    const message: ProvisioningStatusMessage = {
      enrollmentId,
      status,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    await this.publishProvisioningStatus(message);
  }

  /**
   * Check if producer is ready
   */
  isProducerReady(): boolean {
    return this.isReady && this.isEnabled;
  }

  /**
   * Get producer statistics
   */
  getStats(): any {
    return {
      isReady: this.isReady,
      isEnabled: this.isEnabled,
      topic: this.config.topic,
      brokerHost: this.config.brokerHost,
      clientId: this.config.clientId,
    };
  }

  /**
   * Get producer metadata
   */
  async getMetadata(timeout: number = 5000): Promise<any> {
    if (!this.isEnabled || !this.client) {
      throw new Error('Kafka client is disabled or not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client!.loadMetadataForTopics([this.config.topic], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });

      setTimeout(() => {
        reject(new Error('Metadata request timeout'));
      }, timeout);
    });
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    if (!this.isEnabled || !this.producer || !this.client) {
      logger.info('Kafka producer not initialized or disabled, nothing to close');
      return;
    }

    return new Promise((resolve) => {
      logger.info('Closing Kafka producer...');

      this.producer!.close(() => {
        this.client!.close(() => {
          logger.info('Kafka producer and client closed');
          resolve();
        });
      });
    });
  }
}

// Export singleton instance
export const kafkaProducerService = new KafkaProducerService();
