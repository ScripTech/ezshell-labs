import express, { Express } from 'express';
import cors from 'cors';
import { enrollmentRouter } from '../../controllers/enrollment';

interface TestAppOptions {
  database: any;
  kafkaProducer: any;
}

export function createTestApp(options: TestAppOptions): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock dependencies in the app context
  app.locals.db = options.database;
  app.locals.kafkaProducer = options.kafkaProducer;

  // Routes
  app.use('/api/enrollment', enrollmentRouter);

  // Health check endpoint for testing
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('Test app error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
