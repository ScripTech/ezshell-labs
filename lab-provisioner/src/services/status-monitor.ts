import { eq } from 'drizzle-orm';
import { db, provisioningQueue, labProvisions } from '../config/database';
import { awsProvisionerService } from './aws-provisioner';
import { createLogger } from '../utils/logger';

const logger = createLogger('status-monitor');

export interface ProvisioningStep {
  step: 'enrollment' | 'aws_instance_creation' | 'lab_ready';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completedAt?: string;
  error?: string;
}

export class StatusMonitorService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly monitoringInterval: number;
  private isRunning = false;

  constructor(intervalMs: number = 30000) { // Default 30 seconds
    this.monitoringInterval = intervalMs;
  }

  /**
   * Start the background status monitoring
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Status monitor is already running');
      console.warn('Status monitor is already running');
      return;
    }

    logger.info('Starting status monitor service', {
      interval: this.monitoringInterval,
    });

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndUpdateStatuses();
      } catch (error) {
        logger.error('Error in status monitoring cycle', {
          error: error instanceof Error ? error.message : String(error),
        });
        console.error('Error in status monitoring cycle', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, this.monitoringInterval);

    // Run initial check immediately
    this.checkAndUpdateStatuses().catch((error) => {
      logger.error('Error in initial status check', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  /**
   * Stop the background status monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping status monitor service');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Get current provisioning steps for an enrollment
   */
  async getProvisioningSteps(enrollmentId: string): Promise<ProvisioningStep[]> {
    try {
      // Get queue and provision data
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

      logger.info('Status monitor data for steps calculation', {
        enrollmentId,
        queueStatus: queue?.status,
        instanceId: provision?.instanceId,
        instanceState: provision?.instanceState,
        publicIp: provision?.publicIp,
        hasProvision: !!provision
      });

      // Build steps based on current state
      const steps: ProvisioningStep[] = [
        {
          step: 'enrollment',
          status: 'completed', // Always completed if we have queue entry
          completedAt: queue?.createdAt || undefined,
        },
        {
          step: 'aws_instance_creation',
          status: this.getAWSInstanceStatus(queue, provision),
          completedAt: provision?.provisionedAt || undefined,
        },
        {
          step: 'lab_ready',
          status: this.getLabReadyStatus(provision),
          completedAt: provision?.instanceState === 'running' && provision?.publicIp ? provision.updatedAt || undefined : undefined,
        },
      ];

      logger.debug('Generated provisioning steps', {
        enrollmentId,
        steps: steps.map(s => ({ step: s.step, status: s.status, completedAt: s.completedAt }))
      });

      // Add error information if exists
      if (queue?.status === 'failed' && queue?.lastError) {
        const failedStep = steps.find(s => s.status === 'failed');
        if (failedStep) {
          failedStep.error = queue.lastError;
        }
      }

      return steps;
    } catch (error) {
      logger.error('Failed to get provisioning steps', {
        enrollmentId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return default error state
      return [
        { step: 'enrollment', status: 'completed' },
        { step: 'aws_instance_creation', status: 'failed', error: 'Failed to fetch status' },
        { step: 'lab_ready', status: 'pending' },
      ];
    }
  }

  /**
   * Check and update statuses for all active provisioning requests
   */
  private async checkAndUpdateStatuses(): Promise<void> {
    try {
      // Get all processing or queued provisions
      const activeProvisions = await db
        .select({
          enrollmentId: provisioningQueue.enrollmentId,
          queueStatus: provisioningQueue.status,
          instanceId: labProvisions.instanceId,
          instanceState: labProvisions.instanceState,
          provisionId: labProvisions.id,
        })
        .from(provisioningQueue)
        .leftJoin(labProvisions, eq(provisioningQueue.enrollmentId, labProvisions.enrollmentId))
        .where(
          eq(provisioningQueue.status, 'processing')
        );

      logger.debug('Checking status for active provisions', {
        count: activeProvisions.length,
      });

      for (const provision of activeProvisions) {
        await this.updateProvisionStatus(provision);
      }
    } catch (error) {
      logger.error('Failed to check and update statuses', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update status for a specific provision
   */
  private async updateProvisionStatus(provision: any): Promise<void> {
    const { enrollmentId, instanceId, instanceState, provisionId } = provision;

    if (!instanceId) {
      // No instance created yet, check if it should be created
      logger.debug('No instance found for enrollment', { enrollmentId });
      return;
    }

    try {
      // Get real-time instance details from AWS
      const instanceDetails = await awsProvisionerService.getInstanceDetails(instanceId);

      if (!instanceDetails) {
        logger.warn('Could not get instance details', { enrollmentId, instanceId });
        return;
      }

      const currentState = instanceDetails.state;
      const hasStateChanged = currentState !== instanceState;

      logger.debug('Instance status check', {
        enrollmentId,
        instanceId,
        currentState,
        previousState: instanceState,
        hasStateChanged,
        publicIp: instanceDetails.publicIp,
      });

      // Update database if state changed
      if (hasStateChanged || (currentState === 'running' && !instanceDetails.publicIp)) {
        await db
          .update(labProvisions)
          .set({
            instanceState: currentState as any,
            publicIp: instanceDetails.publicIp || undefined,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(labProvisions.id, provisionId));

        logger.info('Updated provision status', {
          enrollmentId,
          instanceId,
          newState: currentState,
          publicIp: instanceDetails.publicIp,
        });
      }

      // Mark as completed if instance is running and has public IP
      if (currentState === 'running' && instanceDetails.publicIp) {
        await db
          .update(provisioningQueue)
          .set({
            status: 'completed',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(provisioningQueue.enrollmentId, enrollmentId));

        logger.info('Lab provisioning completed', {
          enrollmentId,
          instanceId,
          publicIp: instanceDetails.publicIp,
        });
      }

      // Handle failed states
      if (['terminated', 'stopping', 'stopped'].includes(currentState)) {
        await db
          .update(provisioningQueue)
          .set({
            status: 'failed',
            lastError: `Instance entered state: ${currentState}`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(provisioningQueue.enrollmentId, enrollmentId));

        logger.warn('Lab provisioning failed due to instance state', {
          enrollmentId,
          instanceId,
          state: currentState,
        });
      }

    } catch (error) {
      logger.error('Failed to update provision status', {
        enrollmentId,
        instanceId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't mark as failed for temporary AWS API errors
      if (error instanceof Error &&
          (error.message.includes('InvalidInstanceID.NotFound') ||
           error.message.includes('Instance has been terminated'))) {

        await db
          .update(provisioningQueue)
          .set({
            status: 'failed',
            lastError: `Instance not found or terminated: ${error.message}`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(provisioningQueue.enrollmentId, enrollmentId));

        logger.warn('Instance not found, marking as failed', {
          enrollmentId,
          instanceId,
          error: error.message,
        });
      }
    }
  }

  /**
   * Determine AWS instance creation status
   */
  private getAWSInstanceStatus(queue: any, provision: any): 'pending' | 'in_progress' | 'completed' | 'failed' {
    if (queue?.status === 'failed') return 'failed';
    if (!provision?.instanceId) {
      return queue?.status === 'processing' ? 'in_progress' : 'pending';
    }
    if (provision.instanceState === 'pending') return 'in_progress';
    if (['running', 'stopped'].includes(provision.instanceState)) return 'completed';
    if (['terminated', 'shutting-down'].includes(provision.instanceState)) return 'failed';
    return 'in_progress';
  }

  /**
   * Determine lab ready status based on database instance state
   */
  private getLabReadyStatus(provision: any): 'pending' | 'in_progress' | 'completed' | 'failed' {
    if (!provision?.instanceId) {
      logger.debug('Lab ready status: pending (no instanceId)', { provision: !!provision });
      return 'pending';
    }

    // Check the actual instance state from database
    const state = provision.instanceState;
    const hasPublicIp = !!provision.publicIp;

    logger.debug('Lab ready status calculation', {
      instanceId: provision.instanceId,
      state,
      hasPublicIp,
      publicIp: provision.publicIp
    });

    // Lab is ready when instance is running AND has a public IP
    if (state === 'running' && hasPublicIp) {
      logger.info('Lab ready status: COMPLETED', { instanceId: provision.instanceId, publicIp: provision.publicIp });
      return 'completed';
    }

    // Failed states
    if (['terminated', 'shutting-down', 'stopped'].includes(state)) {
      logger.warn('Lab ready status: FAILED', { instanceId: provision.instanceId, state });
      return 'failed';
    }

    // Instance is running but no public IP yet - still in progress
    if (state === 'running' && !hasPublicIp) {
      logger.debug('Lab ready status: in_progress (running but no public IP)', { instanceId: provision.instanceId });
      return 'in_progress';
    }

    // Instance is starting up
    if (['pending', 'running'].includes(state)) {
      logger.debug('Lab ready status: in_progress (instance starting)', { instanceId: provision.instanceId, state });
      return 'in_progress';
    }

    // Default to pending for other states
    logger.debug('Lab ready status: pending (default)', { instanceId: provision.instanceId, state });
    return 'pending';
  }
}

// Export singleton instance
export const statusMonitorService = new StatusMonitorService();
