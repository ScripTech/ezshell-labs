import winston from 'winston';
import path from 'path';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Generate datetime string for log filename
const getLogDateTime = (logDir: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  console.log(`Log dir: ${logDir}`); // Debug log to verify date generation
  return `${year}-${month}-${day}`;
};

// Generate log file paths
const logDir = path.resolve(process.env.LOG_DIR || './logs');
const dateTime = getLogDateTime(logDir);
const logFileName = `lab-provisioner-${dateTime}.log`;
const errorLogFileName = `lab-provisioner-error-${dateTime}.log`;
const exceptionsLogFileName = `lab-provisioner-exceptions-${dateTime}.log`;
const rejectionsLogFileName = `lab-provisioner-rejections-${dateTime}.log`;

// Create custom format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: format,
  }),
  // Error log file
  new winston.transports.File({
    filename: path.join(logDir, errorLogFileName),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  // Combined log file
  new winston.transports.File({
    filename: path.join(logDir, logFileName),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, exceptionsLogFileName) }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, rejectionsLogFileName) }),
  ],
});

// Create structured logging methods
export const createLogger = (service: string) => ({
  error: (message: string, meta?: any) => logger.error(message, { service, ...meta }),
  warn: (message: string, meta?: any) => logger.warn(message, { service, ...meta }),
  info: (message: string, meta?: any) => logger.info(message, { service, ...meta }),
  debug: (message: string, meta?: any) => logger.debug(message, { service, ...meta }),
  http: (message: string, meta?: any) => logger.http(message, { service, ...meta }),
});

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const log = createLogger('http');

  res.on('finish', () => {
    const duration = Date.now() - start;
    log.http(`${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });

  next();
};

// Kafka operation logging
export const logKafkaOperation = (operation: string, topic: string, message?: any) => {
  const log = createLogger('kafka');
  log.info(`Kafka ${operation}`, {
    topic,
    message: message ? JSON.stringify(message) : undefined,
    timestamp: new Date().toISOString(),
  });
};

// AWS operation logging
export const logAWSOperation = (
  operation: string,
  service: string,
  params?: any,
  result?: any
) => {
  const log = createLogger('aws');
  log.info(`AWS ${service} ${operation}`, {
    params: params ? JSON.stringify(params) : undefined,
    result: result ? JSON.stringify(result) : undefined,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, data?: any) => {
  const log = createLogger('database');
  log.info(`Database ${operation}`, {
    table,
    data: data ? JSON.stringify(data) : undefined,
    timestamp: new Date().toISOString(),
  });
};

// Error logging with context
export const logError = (error: Error, context: string, meta?: any) => {
  const log = createLogger('error');
  log.error(`Error in ${context}`, {
    message: error.message,
    stack: error.stack,
    context,
    ...meta,
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  const log = createLogger('performance');
  log.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...meta,
  });
};

export default logger;
