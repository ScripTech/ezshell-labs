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

      logger.info('🔍 Status monitor data for steps calculation', {
        enrollmentId,
        queueStatus: queue?.status,
        instanceId: provision?.instanceId,
        instanceState: provision?.instanceState,
        publicIp: provision?.publicIp,
        hasProvision: !!provision
      });

      // Build steps based on current state
      const awsInstanceStatus = this.getAWSInstanceStatus(queue, provision);
      const labReadyStatus = await this.getLabReadyStatus(provision);

      logger.info('🚦 Step status calculation', {
        enrollmentId,
        awsInstanceStatus,
        labReadyStatus,
        queueStatus: queue?.status,
        instanceState: provision?.instanceState,
        hasPublicIp: !!provision?.publicIp
      });

      const steps: ProvisioningStep[] = [
        {
          step: 'enrollment',
          status: 'completed', // Always completed if we have queue entry
          completedAt: queue?.createdAt || undefined,
        },
        {
          step: 'aws_instance_creation',
          status: awsInstanceStatus,
          completedAt: provision?.provisionedAt || undefined,
        },
        {
          step: 'lab_ready',
          status: labReadyStatus,
          completedAt: provision?.instanceState === 'running' && provision?.publicIp ? provision.updatedAt || undefined : undefined,
        },
      ];

      logger.info('✅ Generated provisioning steps', {
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

      logger.info("🔄 StatusMonitorService --- Checking status for active provisions", {
        count: activeProvisions.length,
        provisions: activeProvisions.map(p => ({
          enrollmentId: p.enrollmentId,
          queueStatus: p.queueStatus,
          instanceId: p.instanceId,
          instanceState: p.instanceState
        }))
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
      logger.info('⚠️  No instance found for enrollment', { enrollmentId });
      return;
    }

    logger.info('🔍 Starting status update for provision', {
      enrollmentId,
      instanceId,
      currentInstanceState: instanceState,
      provisionId
    });

    try {
      // Get real-time instance details from AWS
      const instanceDetails = await awsProvisionerService.getInstanceDetails(instanceId);

      if (!instanceDetails) {
        logger.warn('Could not get instance details', { enrollmentId, instanceId });
        return;
      }

      const currentState = instanceDetails.state;
      const hasStateChanged = currentState !== instanceState;

      logger.info('🌐 Instance status check from AWS', {
        enrollmentId,
        instanceId,
        currentState,
        previousState: instanceState,
        hasStateChanged,
        publicIp: instanceDetails.publicIp,
        privateIp: instanceDetails.privateIp
      });

      // Update database if state changed
      if (hasStateChanged || (currentState === 'running' && !provision.publicIp)) {
        logger.info('📝 Updating provision status in database', {
          enrollmentId,
          instanceId,
          reason: hasStateChanged ? 'state changed' : 'missing public IP',
          newState: currentState,
          newPublicIp: instanceDetails.publicIp
        });

        await db
          .update(labProvisions)
          .set({
            instanceState: currentState as any,
            publicIp: instanceDetails.publicIp || undefined,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(labProvisions.id, provisionId));

        logger.info('✅ Updated provision status', {
          enrollmentId,
          instanceId,
          newState: currentState,
          publicIp: instanceDetails.publicIp,
        });
      } else {
        logger.info('⏭️  No database update needed', {
          enrollmentId,
          instanceId,
          currentState,
          hasPublicIp: !!instanceDetails.publicIp
        });
      }

      // Mark as completed if instance is running and has public IP
      if (currentState === 'running' && instanceDetails.publicIp) {
        logger.info('🎉 Marking lab provisioning as COMPLETED', {
          enrollmentId,
          instanceId,
          publicIp: instanceDetails.publicIp,
          transition: 'processing -> completed'
        });

        await db
          .update(provisioningQueue)
          .set({
            status: 'completed',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(provisioningQueue.enrollmentId, enrollmentId));

        logger.info('✅ Lab provisioning completed', {
          enrollmentId,
          instanceId,
          publicIp: instanceDetails.publicIp,
        });
      } else {
        logger.info('⏳ Lab not ready yet', {
          enrollmentId,
          instanceId,
          currentState,
          hasPublicIp: !!instanceDetails.publicIp,
          reason: currentState !== 'running' ? 'instance not running' : 'no public IP'
        });
      }

      // Handle failed states
      if (['terminated', 'stopping', 'stopped'].includes(currentState)) {
        logger.error('❌ Lab provisioning FAILED due to instance state', {
          enrollmentId,
          instanceId,
          state: currentState,
          transition: 'processing -> failed'
        });

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
   * This step is about whether the instance was successfully CREATED, not whether it's running
   */
  private getAWSInstanceStatus(queue: any, provision: any): 'pending' | 'in_progress' | 'completed' | 'failed' {
    logger.info('🔧 AWS Instance Status Calculation - CREATION FOCUSED', {
      queue: queue ? {
        status: queue.status,
        enrollmentId: queue.enrollmentId,
        updatedAt: queue.updatedAt
      } : null,
      provision: provision ? {
        instanceId: provision.instanceId,
        instanceState: provision.instanceState,
        publicIp: provision.publicIp,
        updatedAt: provision.updatedAt
      } : null
    });

    const result = (() => {
      // Failed provision
      if (queue?.status === 'failed') {
        logger.info('🔧 AWS Instance Creation: FAILED - queue status failed');
        return 'failed';
      }

      // Instance successfully created - AWS Instance Creation is COMPLETED
      if (provision?.instanceId) {
        // Check if instance was terminated after creation
        if (['terminated', 'shutting-down'].includes(provision.instanceState)) {
          logger.info('🔧 AWS Instance Creation: FAILED - instance terminated after creation');
          return 'failed';
        }

        logger.info('🔧 AWS Instance Creation: COMPLETED - instanceId exists', {
          instanceId: provision.instanceId,
          instanceState: provision.instanceState
        });
        return 'completed';
      }

      // No instance yet - check if creation is in progress
      if (queue?.status === 'processing') {
        logger.info('🔧 AWS Instance Creation: IN_PROGRESS - provisioning started');
        return 'in_progress';
      }

      // Still queued
      logger.info('🔧 AWS Instance Creation: PENDING - not started yet');
      return 'pending';
    })();

    logger.info('🔧 AWS Instance Creation Status - FINAL', {
      queueStatus: queue?.status,
      hasInstanceId: !!provision?.instanceId,
      instanceState: provision?.instanceState,
      result
    });

    return result;
  }

  /**
   * Determine lab ready status based on real-time AWS instance state
   * Combines database state with live AWS details for accurate status
   */
  private async getLabReadyStatus(provision: any): Promise<'pending' | 'in_progress' | 'completed' | 'failed'> {
    if (!provision?.instanceId) {
      logger.info('🏷️  Lab ready status: pending (no instanceId)', { provision: !!provision });
      return 'pending';
    }

    logger.info('🧪 Lab ready status calculation - fetching AWS details', {
      instanceId: provision.instanceId,
      dbState: provision.instanceState,
      dbPublicIp: provision.publicIp
    });

    try {
      // Get real-time AWS instance details
      const awsDetails = await awsProvisionerService.getInstanceDetails(provision.instanceId);

      if (!awsDetails) {
        logger.warn('⚠️  Could not fetch AWS details for lab ready check', {
          instanceId: provision.instanceId
        });
        // Fallback to database state
        return this.getLabReadyStatusFromDB(provision);
      }

      logger.info('🌐 AWS Real-time instance details for lab ready check', {
        instanceId: provision.instanceId,
        awsState: awsDetails.state,
        awsPublicIp: awsDetails.publicIp,
        dbState: provision.instanceState,
        dbPublicIp: provision.publicIp
      });

      // Use real-time AWS state for decision making
      const state = awsDetails.state;
      const hasPublicIp = !!awsDetails.publicIp;

      // Failed states
      if (['terminated', 'shutting-down', 'stopped'].includes(state)) {
        logger.warn('❌ Lab ready status: FAILED (AWS real-time)', {
          instanceId: provision.instanceId,
          state
        });
        return 'failed';
      }

      // Lab is ready when instance is running AND has a public IP
      // AWS's "3/3 checks passed" indicates the instance is fully accessible
      if (state === 'running' && hasPublicIp) {
        logger.info('🎯 Lab ready status: COMPLETED (AWS real-time - running with public IP)', {
          instanceId: provision.instanceId,
          publicIp: awsDetails.publicIp,
          state: awsDetails.state
        });
        return 'completed';
      }

      // Instance is running but no public IP yet - still in progress
      if (state === 'running' && !hasPublicIp) {
        logger.info('⏳ Lab ready status: in_progress (AWS real-time - running but no public IP)', {
          instanceId: provision.instanceId,
          state
        });
        return 'in_progress';
      }

      // Instance is starting up
      if (['pending', 'running'].includes(state)) {
        logger.info('🚀 Lab ready status: in_progress (AWS real-time - instance starting)', {
          instanceId: provision.instanceId,
          state
        });
        return 'in_progress';
      }

      // Default to pending for other states
      logger.info('⏸️  Lab ready status: pending (AWS real-time - default)', {
        instanceId: provision.instanceId,
        state
      });
      return 'pending';

    } catch (error) {
      logger.error('❌ Failed to fetch AWS details for lab ready check', {
        instanceId: provision.instanceId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Fallback to database state if AWS call fails
      logger.info('🔄 Falling back to database state for lab ready check');
      return this.getLabReadyStatusFromDB(provision);
    }
  }

  /**
   * Fallback method for lab ready status using database state only
   */
  private getLabReadyStatusFromDB(provision: any): 'pending' | 'in_progress' | 'completed' | 'failed' {
    const state = provision.instanceState;
    const hasPublicIp = !!provision.publicIp;

    logger.info('🗄️  Lab ready status calculation - database fallback', {
      instanceId: provision.instanceId,
      state,
      hasPublicIp,
      publicIp: provision.publicIp
    });

    // Failed states
    if (['terminated', 'shutting-down', 'stopped'].includes(state)) {
      logger.warn('❌ Lab ready status: FAILED (DB fallback)', { instanceId: provision.instanceId, state });
      return 'failed';
    }

    // Lab is ready when instance is running AND has a public IP
    if (state === 'running' && hasPublicIp) {
      logger.info('🎯 Lab ready status: COMPLETED (DB fallback - running with public IP)', {
        instanceId: provision.instanceId,
        publicIp: provision.publicIp
      });
      return 'completed';
    }

    // Instance is running but no public IP yet - still in progress
    if (state === 'running' && !hasPublicIp) {
      logger.info('⏳ Lab ready status: in_progress (DB fallback - running but no public IP)', {
        instanceId: provision.instanceId
      });
      return 'in_progress';
    }

    // Instance is starting up
    if (['pending', 'running'].includes(state)) {
      logger.info('🚀 Lab ready status: in_progress (DB fallback - instance starting)', {
        instanceId: provision.instanceId,
        state
      });
      return 'in_progress';
    }

    // Default to pending for other states
    logger.info('⏸️  Lab ready status: pending (DB fallback - default)', {
      instanceId: provision.instanceId,
      state
    });
    return 'pending';
  }
}

// Export singleton instance
export const statusMonitorService = new StatusMonitorService();
