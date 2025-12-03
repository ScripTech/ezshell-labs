import { KafkaClient, Producer, Consumer, ConsumerGroup } from 'kafka-node';
import { createLogger } from '../utils/logger';

const logger = createLogger('kafka-config');

// Kafka configuration interface
export interface KafkaConfig {
  brokerHost: string;
  clientId: string;
  topic: string;
  consumerGroup: string;
  enabled: boolean;
}

// Get Kafka configuration from environment variables
export const getKafkaConfig = (): KafkaConfig => {
  return {
    brokerHost: process.env.KAFKA_BROKER || 'localhost:9092',
    clientId: process.env.KAFKA_CLIENT_ID || 'lab-provisioner',
    topic: process.env.KAFKA_TOPIC || 'lab-enrollment',
    consumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'lab-provisioner-group',
    enabled: process.env.KAFKA_ENABLED !== 'false', // Default to enabled unless explicitly disabled
  };
};

// Test if Kafka broker is available
export const testKafkaConnection = (brokerHost: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const testClient = new KafkaClient({
        kafkaHost: brokerHost,
        clientId: 'test-connection',
        connectTimeout: 5000,
        requestTimeout: 5000,
        autoConnect: false,
      });

      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          try {
            testClient.close();
          } catch (e) {
            // Ignore close errors
          }
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(false);
      }, 10000);

      testClient.connect();

      testClient.on('connect', () => {
        // Test broker metadata to ensure brokers are actually available
        testClient.loadMetadataForTopics([], (error, result) => {
          clearTimeout(timeout);
          cleanup();

          if (error) {
            logger.debug('Kafka metadata test failed', { error: error.message });
            resolve(false);
          } else {
            logger.debug('Kafka connection and metadata test successful');
            resolve(true);
          }
        });
      });

      testClient.on('error', (error) => {
        clearTimeout(timeout);
        cleanup();
        logger.debug('Kafka connection test failed', { error: error.message });
        resolve(false);
      });

    } catch (error) {
      logger.debug('Kafka connection test exception', {
        error: error instanceof Error ? error.message : String(error)
      });
      resolve(false);
    }
  });
};

// Create Kafka client
export const createKafkaClient = (config: KafkaConfig): KafkaClient => {
  return new KafkaClient({
    kafkaHost: config.brokerHost,
    clientId: config.clientId,
    connectTimeout: 10000,
    requestTimeout: 30000,
    autoConnect: true,
    connectRetryOptions: {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
    },
  });
};

// Create Kafka producer
export const createKafkaProducer = (client: KafkaClient): Producer => {
  return new Producer(client, {
    requireAcks: 1, // Wait for leader acknowledgment
    ackTimeoutMs: 100,
    partitionerType: 2, // Use default partitioner
  });
};

// Create Kafka consumer group
export const createKafkaConsumerGroup = (config: KafkaConfig): ConsumerGroup => {
  return new ConsumerGroup(
    {
      kafkaHost: config.brokerHost,
      groupId: config.consumerGroup,
      sessionTimeout: 15000,
      protocol: ['roundrobin'],
      fromOffset: 'latest', // Start consuming from latest offset
      autoCommit: true,
      autoCommitIntervalMs: 5000,
    },
    [config.topic]
  );
};

// Message interfaces
export interface EnrollmentMessage {
  userId: string;
  labId: string;
  enrollmentId: string;
  timestamp: string;
  messageId: string;
}

export interface ProvisioningStatusMessage {
  enrollmentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  instanceId?: string;
  publicIp?: string;
  error?: string;
  timestamp: string;
}

// Utility functions for message handling
export const createEnrollmentMessage = (
  userId: string,
  labId: string,
  enrollmentId: string
): EnrollmentMessage => {
  return {
    userId,
    labId,
    enrollmentId,
    timestamp: new Date().toISOString(),
    messageId: `${enrollmentId}-${Date.now()}`,
  };
};

export const validateEnrollmentMessage = (message: any): message is EnrollmentMessage => {
  return (
    typeof message === 'object' &&
    typeof message.userId === 'string' &&
    typeof message.labId === 'string' &&
    typeof message.enrollmentId === 'string' &&
    typeof message.timestamp === 'string' &&
    typeof message.messageId === 'string'
  );
};

// Error handling utilities
export const handleKafkaError = (error: Error, context: string): void => {
  console.error(`Kafka error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

// Graceful shutdown for Kafka connections
export const closeKafkaConnections = async (
  client?: KafkaClient,
  producer?: Producer,
  consumer?: ConsumerGroup
): Promise<void> => {
  try {
    if (consumer) {
      consumer.close(true, () => {
        console.log('Kafka consumer closed');
      });
    }

    if (producer) {
      producer.close(() => {
        console.log('Kafka producer closed');
      });
    }

    if (client) {
      client.close(() => {
        console.log('Kafka client closed');
      });
    }
  } catch (error) {
    console.error('Error closing Kafka connections:', error);
  }
};
