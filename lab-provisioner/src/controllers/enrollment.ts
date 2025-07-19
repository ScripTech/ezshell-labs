import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { db, labEnrollments, labProvisions, provisioningQueue } from '../config/database';
import { kafkaProducerService } from '../services/kafka-producer';
import { createLogger } from '../utils/logger';

const logger = createLogger('enrollment-controller');
const router = Router();

// Validation schemas
const enrollmentSchema = Joi.object({
  userId: Joi.string().required().min(1).max(255),
  labId: Joi.string().required().min(1).max(255),
});

const statusSchema = Joi.object({
  enrollmentId: Joi.string().required().uuid(),
});

/**
 * POST /enroll - Enroll user in lab and queue for provisioning
 */
router.post('/enroll', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = enrollmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString(),
      });
    }

    const { userId, labId } = value;
    const enrollmentId = uuidv4();

    logger.info('Processing lab enrollment request', {
      userId,
      labId,
      enrollmentId,
    });

    // Check if user is already enrolled in this lab
    const existingEnrollment = await db
      .select()
      .from(labEnrollments)
      .where(
        and(
          eq(labEnrollments.userId, userId),
          eq(labEnrollments.labId, labId),
          eq(labEnrollments.status, 'enrolled')
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      logger.warn('User already enrolled in lab', {
        userId,
        labId,
        existingEnrollmentId: existingEnrollment[0].id,
      });

      return res.status(409).json({
        error: 'Already enrolled',
        message: 'User is already enrolled in this lab',
        enrollmentId: existingEnrollment[0].id,
        timestamp: new Date().toISOString(),
      });
    }

    // Begin database transaction
    await db.transaction(async (tx) => {
      // Create lab enrollment record
      await tx.insert(labEnrollments).values({
        id: enrollmentId,
        userId,
        labId,
        status: 'enrolled',
        progress: 0,
        enrolledAt: new Date().toISOString(),
      });

      // Create provisioning queue entry
      await tx.insert(provisioningQueue).values({
        id: uuidv4(),
        enrollmentId,
        userId,
        labId,
        status: 'queued',
        messageData: {
          userId,
          labId,
          enrollmentId,
          requestedAt: new Date().toISOString(),
        },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      logger.info('Database records created successfully', {
        enrollmentId,
        userId,
        labId,
      });
    });

    // Publish enrollment message to Kafka
    try {
      await kafkaProducerService.enrollLab(userId, labId, enrollmentId);
      logger.info('Enrollment message published to Kafka', {
        enrollmentId,
        userId,
        labId,
      });
    } catch (kafkaError) {
      logger.error('Failed to publish to Kafka, but enrollment created', {
        enrollmentId,
        error: kafkaError instanceof Error ? kafkaError.message : String(kafkaError),
      });

      // Update queue status to indicate Kafka failure
      await db
        .update(provisioningQueue)
        .set({
          status: 'failed',
          lastError: `Kafka publish failed: ${kafkaError instanceof Error ? kafkaError.message : String(kafkaError)}`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(provisioningQueue.enrollmentId, enrollmentId));
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Lab enrollment queued for provisioning',
      data: {
        enrollmentId,
        userId,
        labId,
        status: 'queued',
        queuedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Enrollment request failed', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body,
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process enrollment request',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /status/:enrollmentId - Get provisioning status
 */
router.get('/status/:enrollmentId', async (req: Request, res: Response) => {
  try {
    // Validate parameters
    const { error, value } = statusSchema.validate({ enrollmentId: req.params.enrollmentId });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString(),
      });
    }

    const { enrollmentId } = value;

    logger.debug('Fetching enrollment status', { enrollmentId });

    // Get enrollment details
    const enrollment = await db
      .select()
      .from(labEnrollments)
      .where(eq(labEnrollments.id, enrollmentId))
      .limit(1);

    if (enrollment.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Enrollment not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Get provisioning queue status
    const queueStatus = await db
      .select()
      .from(provisioningQueue)
      .where(eq(provisioningQueue.enrollmentId, enrollmentId))
      .limit(1);

    // Get provision details if available
    const provision = await db
      .select()
      .from(labProvisions)
      .where(eq(labProvisions.enrollmentId, enrollmentId))
      .limit(1);

    const enrollmentData = enrollment[0];
    const queueData = queueStatus[0];
    const provisionData = provision[0];

    // Build response
    const response = {
      enrollmentId,
      userId: enrollmentData.userId,
      labId: enrollmentData.labId,
      enrollmentStatus: enrollmentData.status,
      progress: enrollmentData.progress,
      enrolledAt: enrollmentData.enrolledAt,
      completedAt: enrollmentData.completedAt,
      provisioning: {
        status: queueData?.status || 'unknown',
        attempts: queueData?.attempts || 0,
        maxAttempts: queueData?.maxAttempts || 3,
        lastError: queueData?.lastError,
        queuedAt: queueData?.createdAt,
        processedAt: queueData?.processedAt,
      },
      instance: provisionData ? {
        instanceId: provisionData.instanceId,
        publicIp: provisionData.publicIp,
        privateIp: provisionData.privateIp,
        state: provisionData.instanceState,
        keyPairName: provisionData.keyPairName,
        provisionedAt: provisionData.provisionedAt,
        terminatedAt: provisionData.terminatedAt,
      } : null,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(response);

  } catch (error) {
    logger.error('Status request failed', {
      enrollmentId: req.params.enrollmentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch enrollment status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /list - List all enrollments (for admin/debugging)
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    logger.debug('Listing enrollments', { page, limit, offset });

    // Get enrollments with basic info
    const enrollments = await db
      .select({
        enrollmentId: labEnrollments.id,
        userId: labEnrollments.userId,
        labId: labEnrollments.labId,
        status: labEnrollments.status,
        progress: labEnrollments.progress,
        enrolledAt: labEnrollments.enrolledAt,
        completedAt: labEnrollments.completedAt,
        provisioningStatus: provisioningQueue.status,
        instanceId: labProvisions.instanceId,
        instanceState: labProvisions.instanceState,
        publicIp: labProvisions.publicIp,
      })
      .from(labEnrollments)
      .leftJoin(provisioningQueue, eq(labEnrollments.id, provisioningQueue.enrollmentId))
      .leftJoin(labProvisions, eq(labEnrollments.id, labProvisions.enrollmentId))
      .limit(limit)
      .offset(offset)
      .orderBy(labEnrollments.enrolledAt);

    res.status(200).json({
      data: enrollments,
      pagination: {
        page,
        limit,
        total: enrollments.length,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('List enrollments failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list enrollments',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as enrollmentRouter };
