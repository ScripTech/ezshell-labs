import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger, requestLogger } from './utils/logger';
import { checkDatabaseConnection, closeDatabaseConnection } from './config/database';
import { sshKeyManager } from './utils/ssh-key-manager';
import { kafkaConsumerService } from './services/kafka-consumer';
import { kafkaProducerService } from './services/kafka-producer';
import { statusMonitorService } from './services/status-monitor';
import { enrollmentRouter } from './controllers/enrollment';

// Load environment variables
dotenv.config();

const logger = createLogger('app');
const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "lab-provisioner",
      version: "1.0.0",
      checks: {
        database: dbStatus ? "connected" : "disconnected",
        ssh_keys: "ready",
        kafka_consumer: kafkaConsumerService.isConsumerRunning()
          ? "running"
          : "stopped",
        status_monitor: "running", // Status monitor is always running once started
      },
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'lab-provisioner',
      version: '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api/enrollment', enrollmentRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'EZShell Lab Provisioner',
    version: '1.0.0',
    description: 'Microservice for provisioning AWS EC2 lab instances',
    endpoints: {
      health: '/health',
      enroll: 'POST /api/enrollment/enroll',
      status: 'GET /api/enrollment/status/:enrollmentId',
      steps: 'GET /api/enrollment/steps/:enrollmentId',
      ready: 'GET /api/enrollment/ready/:enrollmentId',
    },
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Initialize services
async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing services...');

    // Initialize SSH key manager
    await sshKeyManager.initialize();
    logger.info('SSH key manager initialized');

    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    logger.info('Database connection verified');

    // Initialize Kafka services (with connection testing)
    if (process.env.KAFKA_ENABLED !== 'false') {
      await kafkaProducerService.initialize();
      logger.info('Kafka producer initialized');

      await kafkaConsumerService.initialize();
      logger.info('Kafka consumer initialized');

      // Start Kafka consumer
      kafkaConsumerService.start();
      logger.info('Kafka consumer started');
    } else {
      logger.info('Kafka is disabled, skipping Kafka initialization');
    }

    // Start status monitoring service
    statusMonitorService.start();
    logger.info('Status monitor service started');    // Start cleanup routine for expired keys
    setInterval(async () => {
      try {
        await sshKeyManager.cleanupExpiredKeys(2); // Cleanup keys older than 2 hours
      } catch (error) {
        logger.error('SSH key cleanup failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 60 * 60 * 1000); // Run every hour

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Stop services
    statusMonitorService.stop();
    await kafkaConsumerService.stop();
    await kafkaProducerService.close();

    // Close database connections
    await closeDatabaseConnection();

    // Additional cleanup here
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    await initializeServices();

    const server = app.listen(PORT, () => {
      logger.info(`Lab Provisioner service started Port: ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      });
    });

    // Setup graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      // Give some time to flush logs
      setTimeout(() => process.exit(1), 100);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString(),
      });
      // Give some time to flush logs
      setTimeout(() => process.exit(1), 100);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default app;
