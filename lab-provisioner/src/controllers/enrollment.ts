import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { db, labEnrollments, labProvisions, provisioningQueue, sshKeys } from '../config/database';
import { kafkaProducerService } from '../services/kafka-producer';
import { awsProvisionerService } from '../services/aws-provisioner';
import { statusMonitorService } from '../services/status-monitor';
import { sshKeyManager } from '../utils/ssh-key-manager';
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
 * Process direct provisioning (when Kafka is disabled)
 */
async function processDirectProvisioning(
  enrollmentId: string,
  userId: string,
  labId: string
): Promise<void> {
  try {
    logger.info('Starting direct provisioning', {
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

    // Update queue status to processing (not completed yet - let the background monitor handle completion)
    await db
      .update(provisioningQueue)
      .set({
        status: 'processing',
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(provisioningQueue.enrollmentId, enrollmentId));

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

    logger.info('Direct provisioning completed successfully', {
      enrollmentId,
      instanceId: provisionResult.instanceId,
      provisionId,
    });

    // Background status monitor will handle the rest of the updates when instance reaches 'running' state

  } catch (error) {
    logger.error('Direct provisioning failed', {
      enrollmentId,
      userId,
      labId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Update queue status to failed
    await db
      .update(provisioningQueue)
      .set({
        status: 'failed',
        lastError: error instanceof Error ? error.message : String(error),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(provisioningQueue.enrollmentId, enrollmentId));
  }
}

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

    // Publish enrollment message to Kafka (if enabled)
    const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';

    if (kafkaEnabled) {
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
    } else {
      logger.info('Kafka is disabled, starting direct provisioning', {
        enrollmentId,
        userId,
        labId,
      });

      // Update queue status to indicate processing without Kafka
      await db
        .update(provisioningQueue)
        .set({
          status: 'processing',
          processedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(provisioningQueue.enrollmentId, enrollmentId));

      // Start direct provisioning in background
      setImmediate(async () => {
        try {
          await processDirectProvisioning(enrollmentId, userId, labId);
        } catch (error) {
          logger.error('Direct provisioning failed', {
            enrollmentId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
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
    let instanceDetails = null;
    let connectionInfo = null;

    if (provisionData && provisionData.instanceId) {
      // Get real-time instance state from AWS
      try {
        const awsDetails = await awsProvisionerService.getInstanceDetails(provisionData.instanceId);

        instanceDetails = {
          instanceId: provisionData.instanceId,
          publicIp: awsDetails.publicIp || provisionData.publicIp,
          privateIp: awsDetails.privateIp || provisionData.privateIp,
          publicDnsName: awsDetails.publicDnsName,
          state: awsDetails.state, // Real-time state from AWS
          keyPairName: provisionData.keyPairName,
          provisionedAt: provisionData.provisionedAt,
          terminatedAt: provisionData.terminatedAt,
        };

        // Provide connection information if instance is ready
        if (awsDetails.state === 'running' && awsDetails.publicIp) {
          connectionInfo = {
            ready: true,
            message: 'Your lab instance is ready to use!',
            ssh: {
              command: `ssh -i keys/${provisionData.keyPairName}.pem labuser@${awsDetails.publicIp}`,
              host: awsDetails.publicIp,
              username: 'labuser',
              keyFile: `${provisionData.keyPairName}.pem`
            },
            webAccess: awsDetails.publicDnsName ? {
              url: `http://${awsDetails.publicDnsName}`,
              publicDns: awsDetails.publicDnsName
            } : null
          };
        } else {
          connectionInfo = {
            ready: false,
            message: awsDetails.state === 'pending'
              ? 'Your lab instance is starting up. Please wait a few more minutes...'
              : `Instance is ${awsDetails.state}. Please check back in a moment.`,
            estimatedWaitTime: awsDetails.state === 'pending' ? '2-3 minutes' : null
          };
        }
      } catch (error) {
        logger.warn('Failed to get real-time instance details', {
          instanceId: provisionData.instanceId,
          error: error instanceof Error ? error.message : String(error)
        });

        // Fallback to stored data with helpful message
        instanceDetails = {
          instanceId: provisionData.instanceId,
          publicIp: provisionData.publicIp,
          privateIp: provisionData.privateIp,
          state: provisionData.instanceState,
          keyPairName: provisionData.keyPairName,
          provisionedAt: provisionData.provisionedAt,
          terminatedAt: provisionData.terminatedAt,
        };

        // Provide estimated connection info based on time elapsed
        const provisionedTime = new Date(provisionData.provisionedAt || '').getTime();
        const elapsedMinutes = (Date.now() - provisionedTime) / (1000 * 60);

        if (elapsedMinutes > 5 && provisionData.instanceState === 'pending') {
          // Assume it might be ready after 5 minutes
          connectionInfo = {
            ready: 'unknown',
            message: 'Your lab instance should be ready soon. Try connecting with SSH.',
            note: 'Unable to check real-time status due to AWS permissions',
            ssh: {
              command: `ssh -i keys/${provisionData.keyPairName}.pem labuser@<PUBLIC_IP>`,
              host: '<Check AWS Console for Public IP>',
              username: 'labuser',
              keyFile: `${provisionData.keyPairName}.pem`
            }
          };
        } else {
          connectionInfo = {
            ready: false,
            message: 'Lab instance is being prepared. Please wait a few more minutes.',
            estimatedWaitTime: '2-5 minutes',
            note: 'Unable to check real-time status due to AWS permissions'
          };
        }
      }
    }

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
      instance: instanceDetails,
      connection: connectionInfo,
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
 * GET /steps/:enrollmentId - Get detailed provisioning steps
 */
router.get('/steps/:enrollmentId', async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;

    // Validate enrollment ID
    const { error } = statusSchema.validate({ enrollmentId });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString(),
      });
    }

    logger.debug('Fetching provisioning steps', { enrollmentId });

    // Check if enrollment exists
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

    // Get detailed steps from status monitor
    const steps = await statusMonitorService.getProvisioningSteps(enrollmentId);

    // Also get direct database state for accurate status determination
    const [queueData, provisionData] = await Promise.all([
      db.select().from(provisioningQueue)
        .where(eq(provisioningQueue.enrollmentId, enrollmentId))
        .limit(1),
      db.select().from(labProvisions)
        .where(eq(labProvisions.enrollmentId, enrollmentId))
        .limit(1)
    ]);

    const queue = queueData[0];
    const provision = provisionData[0];

    logger.info('Database state for status calculation', {
      enrollmentId,
      queueStatus: queue?.status,
      instanceState: provision?.instanceState,
      hasPublicIp: !!provision?.publicIp,
      steps: steps.map(s => ({ step: s.step, status: s.status }))
    });

    // Calculate overall progress percentage
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    // Determine overall status based on database state AND steps
    const hasFailedSteps = steps.some(step => step.status === 'failed');
    const hasInProgressSteps = steps.some(step => step.status === 'in_progress');
    const allCompleted = steps.every(step => step.status === 'completed');

    // Check if lab is actually ready based on database state
    const isLabReady = provision?.instanceState === 'running' && !!provision?.publicIp;
    const isQueueCompleted = queue?.status === 'completed';

    let overallStatus = 'in_progress';
    if (hasFailedSteps || queue?.status === 'failed') {
      overallStatus = 'failed';
    } else if (isLabReady && isQueueCompleted) {
      // Lab is definitely ready if instance is running with public IP AND queue is completed
      overallStatus = 'completed';
    } else if (allCompleted) {
      // All steps completed according to status monitor
      overallStatus = 'completed';
    } else if (!hasInProgressSteps && completedSteps === 1) {
      overallStatus = 'queued';
    }

    logger.info('Overall status determined', {
      enrollmentId,
      overallStatus,
      isLabReady,
      isQueueCompleted,
      allCompleted,
      hasFailedSteps,
      hasInProgressSteps
    });

    // Get connection info if lab is ready
    let connectionInfo = null;
    const labReadyStep = steps.find(step => step.step === 'lab_ready');
    if (labReadyStep?.status === 'completed') {
      const provision = await db
        .select()
        .from(labProvisions)
        .where(eq(labProvisions.enrollmentId, enrollmentId))
        .limit(1);

      if (provision.length > 0 && provision[0].publicIp) {
        connectionInfo = {
          ready: true,
          ssh: {
            command: `ssh -i keys/${provision[0].keyPairName}.pem labuser@${provision[0].publicIp}`,
            host: provision[0].publicIp,
            username: 'labuser',
            keyFile: `${provision[0].keyPairName}.pem`
          },
          webAccess: {
            url: `http://${provision[0].publicIp}`,
            ip: provision[0].publicIp
          }
        };
      }
    }

    return res.status(200).json({
      enrollmentId,
      overallStatus,
      progressPercentage,
      steps,
      connection: connectionInfo,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Steps request failed', {
      enrollmentId: req.params.enrollmentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch provisioning steps',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /ready/:enrollmentId - Check if lab instance is ready to use
 */
router.get('/ready/:enrollmentId', async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;

    // Get provision details
    const provision = await db
      .select()
      .from(labProvisions)
      .where(eq(labProvisions.enrollmentId, enrollmentId))
      .limit(1);

    if (provision.length === 0) {
      return res.status(404).json({
        ready: false,
        message: 'Lab instance not found',
        timestamp: new Date().toISOString(),
      });
    }

    const provisionData = provision[0];

    if (!provisionData.instanceId) {
      return res.status(200).json({
        ready: false,
        message: 'Lab instance is being prepared',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Check real-time AWS instance state
      const awsDetails = await awsProvisionerService.getInstanceDetails(provisionData.instanceId);

      const isReady = awsDetails.state === 'running' && awsDetails.publicIp;

      return res.status(200).json({
        ready: isReady,
        state: awsDetails.state,
        publicIp: awsDetails.publicIp,
        message: isReady
          ? 'Your lab instance is ready to use!'
          : awsDetails.state === 'pending'
            ? 'Lab instance is starting up...'
            : `Lab instance is ${awsDetails.state}`,
        estimatedWaitTime: awsDetails.state === 'pending' ? '2-3 minutes' : null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to check instance readiness', {
        enrollmentId,
        instanceId: provisionData.instanceId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Provide fallback information
      const provisionedTime = new Date(provisionData.provisionedAt || '').getTime();
      const elapsedMinutes = (Date.now() - provisionedTime) / (1000 * 60);

      return res.status(200).json({
        ready: elapsedMinutes > 5 ? 'likely' : false,
        message: elapsedMinutes > 5
          ? 'Lab instance should be ready.'
          : 'Lab instance is starting up...',
        note: 'Unable to check real-time status due to AWS permissions',
        elapsedMinutes: Math.round(elapsedMinutes),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Ready check failed', {
      enrollmentId: req.params.enrollmentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      ready: false,
      error: 'Internal server error',
      message: 'Failed to check lab readiness',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as enrollmentRouter };
