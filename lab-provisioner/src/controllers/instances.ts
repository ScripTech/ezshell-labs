import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { awsProvisionerService } from '../services/aws-provisioner';
import { createLogger } from '../utils/logger';
import { db, labProvisions, labEnrollments } from '../config/database';
import { eq } from 'drizzle-orm';

const logger = createLogger('instances-controller');
const router = Router();

// Validation schema for termination
const terminateSchema = Joi.object({
  instanceId: Joi.string().required().min(1),
  force: Joi.boolean().optional().default(false),
});

/**
 * GET /api/instances
 * List all lab instances from AWS
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching all lab instances from AWS');

    const instances = await awsProvisionerService.listLabInstances();

    // Enrich with database information
    const enrichedInstances = await Promise.all(
      instances.map(async (instance) => {
        try {
          // Find provision record for this instance
          const provision = await db
            .select()
            .from(labProvisions)
            .where(eq(labProvisions.instanceId, instance.instanceId))
            .limit(1);

          const provisionData = provision[0];

          // Calculate uptime from AWS launchTime (more accurate than database provisioned time)
          const launchTime = instance.launchTime ? new Date(instance.launchTime) : null;
          const uptimeMinutes = launchTime
            ? Math.floor((Date.now() - launchTime.getTime()) / 1000 / 60)
            : null;

          // Calculate cost based on uptime
          const hourlyCost = 0.0116; // t2.micro cost per hour
          const sessionCost = uptimeMinutes
            ? parseFloat(((uptimeMinutes / 60) * hourlyCost).toFixed(4))
            : null;

          return {
            ...instance,
            // Additional database information
            provisionId: provisionData?.id,
            enrollmentId: provisionData?.enrollmentId || instance.enrollmentId,
            createdAt: provisionData?.createdAt,
            provisionedAt: provisionData?.provisionedAt,
            keyPairName: provisionData?.keyPairName,
            // Use launchTime for uptime calculation
            uptime: uptimeMinutes,
            launchTime: instance.launchTime,
            // Cost information
            sessionCost,
            hourlyCost,
          };
        } catch (dbError) {
          logger.warn('Failed to enrich instance with database data', {
            instanceId: instance.instanceId,
            error: dbError instanceof Error ? dbError.message : String(dbError),
          });

          return {
            ...instance,
            uptime: null,
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedInstances,
      total: enrichedInstances.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to fetch lab instances', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch instances',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/instances/stats/overview
 * Get overview statistics of all instances
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching instance statistics');

    const instances = await awsProvisionerService.listLabInstances();

    const stats = instances.reduce((acc, instance) => {
      acc.total++;
      acc.byState[instance.state] = (acc.byState[instance.state] || 0) + 1;
      return acc;
    }, {
      total: 0,
      byState: {} as Record<string, number>,
    });

    // Calculate costs (rough estimate)
    const runningInstances = stats.byState['running'] || 0;
    const estimatedHourlyCost = runningInstances * 0.0116; // t2.micro cost per hour
    const estimatedDailyCost = estimatedHourlyCost * 24;

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        costs: {
          estimatedHourlyCost: parseFloat(estimatedHourlyCost.toFixed(4)),
          estimatedDailyCost: parseFloat(estimatedDailyCost.toFixed(2)),
          currency: 'USD',
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to fetch instance statistics', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/instances/:instanceId
 * Get details for a specific instance
 */
router.get('/:instanceId', async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;

    logger.info('Fetching instance details', { instanceId });

    const instanceDetails = await awsProvisionerService.getInstanceDetails(instanceId);

    // Get database information
    const provision = await db
      .select()
      .from(labProvisions)
      .where(eq(labProvisions.instanceId, instanceId))
      .limit(1);

    const provisionData = provision[0];

    // Get enrollment information if available
    let enrollmentData = null;
    if (provisionData?.enrollmentId) {
      try {
        const enrollment = await db
          .select()
          .from(labEnrollments)
          .where(eq(labEnrollments.id, provisionData.enrollmentId))
          .limit(1);

        enrollmentData = enrollment[0];
      } catch (error) {
        logger.warn('Failed to fetch enrollment data', {
          enrollmentId: provisionData.enrollmentId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Calculate uptime and cost from AWS launchTime (more accurate)
    const launchTime = instanceDetails.launchTime ? new Date(instanceDetails.launchTime) : null;
    const uptimeMinutes = launchTime
      ? Math.floor((Date.now() - launchTime.getTime()) / 1000 / 60)
      : null;

    const enrichedDetails = {
      ...instanceDetails,
      instanceId,
      // Provision data
      provisionId: provisionData?.id,
      enrollmentId: provisionData?.enrollmentId,
      createdAt: provisionData?.createdAt,
      provisionedAt: provisionData?.provisionedAt,
      keyPairName: provisionData?.keyPairName,
      uptime: uptimeMinutes,
      // Enrollment data
      userId: enrollmentData?.userId,
      labId: enrollmentData?.labId,
      enrollmentStatus: enrollmentData?.status,
      enrolledAt: enrollmentData?.enrolledAt,
      // Instance metadata
      instanceType: 't2.micro', // Default for lab instances
      region: process.env.AWS_REGION || 'us-east-1',
      estimatedCost: launchTime
        ? {
            sessionCost: parseFloat(((uptimeMinutes! / 60) * 0.0116).toFixed(4)),
            hourlyRate: 0.0116,
            currency: 'USD'
          }
        : null,
    };

    res.status(200).json({
      success: true,
      data: enrichedDetails,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to fetch instance details', {
      instanceId: req.params.instanceId,
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch instance details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});/**
 * POST /api/instances/:instanceId/terminate
 * Terminate a specific instance
 */
router.post('/:instanceId/terminate', async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const { error, value } = terminateSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message),
      });
      return;
    }

    const { force, reqInstanceId } = value;

    if (instanceId === reqInstanceId) {
      res.status(400).json({
        success: false,
        error: "Invalid Request",
      });
      return;
    }


    logger.info('🔻 Terminating instance', { instanceId, force });

    // Get provision record to find key pair name
    const provision = await db
      .select()
      .from(labProvisions)
      .where(eq(labProvisions.instanceId, instanceId))
      .limit(1);

    const keyPairName = provision[0]?.keyPairName;

    // Terminate the instance
    await awsProvisionerService.terminateInstance(instanceId, keyPairName || undefined);

    // Update database if provision exists
    if (provision.length > 0) {
      await db
        .update(labProvisions)
        .set({
          instanceState: 'terminated',
          terminatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(labProvisions.id, provision[0].id));
    }

    logger.info('Instance terminated successfully', { instanceId });

    res.status(200).json({
      success: true,
      message: 'Instance terminated successfully',
      data: {
        instanceId,
        status: 'terminated',
        terminatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Failed to terminate instance', {
      instanceId: req.params.instanceId,
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to terminate instance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as instancesRouter };
