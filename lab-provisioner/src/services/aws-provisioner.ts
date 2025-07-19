import AWS from 'aws-sdk';
import {
  getAWSConfig,
  createEC2Instance,
  createLabInstanceConfig,
  AWSProvisioningError,
  generateKeyPairName,
  parseInstanceState,
  createCleanupTags
} from '../config/aws';
import { sshKeyManager } from '../utils/ssh-key-manager';
import { createLogger } from '../utils/logger';

const logger = createLogger('aws-provisioner');

export interface ProvisioningResult {
  instanceId: string;
  publicIp?: string;
  privateIp?: string;
  keyPairName: string;
  privateKeyPath: string;
  state: string;
}

export class AWSProvisionerService {
  private ec2: AWS.EC2;
  private config = getAWSConfig();

  constructor() {
    this.ec2 = createEC2Instance(this.config);
    logger.info('AWS Provisioner initialized', {
      region: this.config.region,
      instanceType: this.config.instanceType,
      ec2Region: this.ec2.config.region,
      configRegion: this.config.region
    });
  }

  /**
   * Create a new key pair for the lab instance
   */
  async createKeyPair(keyPairName: string): Promise<{ publicKey: string; privateKey: string }> {
    try {
      logger.info('Creating AWS key pair', {
        keyPairName,
        region: this.config.region,
        awsRegion: this.ec2.config.region
      });

      const params: AWS.EC2.CreateKeyPairRequest = {
        KeyName: keyPairName,
        KeyType: 'rsa',
        TagSpecifications: [
          {
            ResourceType: 'key-pair',
            Tags: [
              {
                Key: 'Name',
                Value: keyPairName,
              },
              {
                Key: 'Project',
                Value: 'ezshell-labs',
              },
              {
                Key: 'CreatedBy',
                Value: 'lab-provisioner',
              },
              ...createCleanupTags(2), // Auto-cleanup after 2 hours
            ],
          },
        ],
      };

      const result = await this.ec2.createKeyPair(params).promise();

      if (!result.KeyMaterial) {
        throw new AWSProvisioningError(
          'Key pair creation failed: No private key material returned',
          'createKeyPair'
        );
      }

      logger.info('AWS key pair created successfully', {
        keyPairName,
        region: this.config.region,
        awsRegion: this.ec2.config.region
      });

      return {
        publicKey: result.KeyFingerprint || '',
        privateKey: result.KeyMaterial,
      };
    } catch (error) {
      const awsError = error as AWS.AWSError;
      logger.error('Failed to create AWS key pair', {
        keyPairName,
        error: awsError.message,
        code: awsError.code,
        region: this.config.region,
        awsRegion: this.ec2.config.region
      });

      throw new AWSProvisioningError(
        `Failed to create key pair: ${awsError.message}`,
        'createKeyPair',
        awsError
      );
    }
  }

  /**
   * Launch an EC2 instance for the lab
   */
  async launchLabInstance(
    userId: string,
    labId: string,
    enrollmentId: string
  ): Promise<ProvisioningResult> {
    const keyPairName = generateKeyPairName(userId, labId);

    try {
      // Create key pair first
      const keyPair = await this.createKeyPair(keyPairName);

      // Save private key securely
      const privateKeyPath = await sshKeyManager.savePrivateKey(
        keyPairName,
        keyPair.privateKey
      );

      // Create instance configuration
      const launchConfig = createLabInstanceConfig(
        this.config,
        userId,
        labId,
        enrollmentId,
        keyPairName
      );

      logger.info('Launching EC2 instance', {
        userId,
        labId,
        enrollmentId,
        keyPairName,
        region: this.config.region,
        awsRegion: this.ec2.config.region,
        instanceType: launchConfig.instanceType,
      });

      // Launch instance
      const params: AWS.EC2.RunInstancesRequest = {
        ImageId: launchConfig.amiId,
        MinCount: 1,
        MaxCount: 1,
        InstanceType: launchConfig.instanceType as AWS.EC2.InstanceType,
        KeyName: launchConfig.keyName,
        SecurityGroupIds: launchConfig.securityGroupIds,
        // SubnetId: launchConfig.subnetId,
        UserData: launchConfig.userData,
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: launchConfig.tags,
          },
        ],
        ...(process.env.AWS_IAM_INSTANCE_PROFILE && {
          IamInstanceProfile: {
            Name: process.env.AWS_IAM_INSTANCE_PROFILE,
          },
        }),
        Monitoring: {
          Enabled: true,
        },
      };

      console.log('Launching EC2 instance', {
        userId,
        labId,
        enrollmentId,
        keyPairName,
        instanceType: launchConfig.instanceType,
      });

      logger.info('About to call EC2 runInstances', {
        region: this.config.region,
        awsRegion: this.ec2.config.region,
        keyName: params.KeyName,
        params: {
          ImageId: params.ImageId,
          InstanceType: params.InstanceType,
          SubnetId: params.SubnetId,
          SecurityGroupIds: params.SecurityGroupIds
        }
      });

      const result = await this.ec2.runInstances(params).promise();

      if (!result.Instances || result.Instances.length === 0) {
        throw new AWSProvisioningError(
          'Instance launch failed: No instances returned',
          'runInstances'
        );
      }

      const instance = result.Instances[0];
      const instanceId = instance.InstanceId!;

      logger.info('EC2 instance launched successfully', {
        instanceId,
        state: instance.State?.Name,
        userId,
        labId,
        enrollmentId,
      });

      return {
        instanceId,
        keyPairName,
        privateKeyPath,
        state: parseInstanceState(instance.State?.Name || 'pending'),
        privateIp: instance.PrivateIpAddress,
        // Public IP will be available after instance is running
      };
    } catch (error) {
      // Cleanup on failure
      try {
        await this.cleanupFailedProvisioning(keyPairName);
      } catch (cleanupError) {
        logger.error('Failed to cleanup after provisioning failure', {
          keyPairName,
          cleanupError: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }

      if (error instanceof AWSProvisioningError) {
        throw error;
      }

      const awsError = error as AWS.AWSError;
      logger.error('Failed to launch EC2 instance', {
        error: awsError.message,
        code: awsError.code,
        userId,
        labId,
        enrollmentId,
        region: this.config.region,
        awsRegion: this.ec2.config.region
      });

      throw new AWSProvisioningError(
        `Failed to launch instance: ${awsError.message}`,
        'runInstances',
        awsError
      );
    }
  }

  /**
   * Get instance status and IP addresses
   */
  async getInstanceDetails(instanceId: string): Promise<{
    state: string;
    publicIp?: string;
    privateIp?: string;
    publicDnsName?: string;
  }> {
    try {
      const params: AWS.EC2.DescribeInstancesRequest = {
        InstanceIds: [instanceId],
      };

      const result = await this.ec2.describeInstanceStatus(params).promise();

      if (!result.InstanceStatuses || result.InstanceStatuses.length === 0) {
        throw new AWSProvisioningError(
          `Instance ${instanceId} not found`,
          'describeInstances'
        );
      }

      const instance = result.InstanceStatuses[0];

      return {
        state: parseInstanceState(instance.InstanceState?.Name || 'unknown'),
      };
    } catch (error) {
      const awsError = error as AWS.AWSError;
      logger.error('Failed to get instance details', {
        instanceId,
        error: awsError.message,
        code: awsError.code,
      });

      throw new AWSProvisioningError(
        `Failed to get instance details: ${awsError.message}`,
        'describeInstances',
        awsError
      );
    }
  }

  /**
   * Wait for instance to be in running state
   */
  async waitForInstanceRunning(
    instanceId: string,
    timeoutMs: number = 300000 // 5 minutes
  ): Promise<{ publicIp?: string; privateIp?: string; publicDnsName?: string }> {
    const startTime = Date.now();
    const pollInterval = parseInt(process.env.INSTANCE_POLL_INTERVAL || '5000');

    logger.info('Waiting for instance to be running', {
      instanceId,
      timeoutMs: `${timeoutMs}ms`,
      pollInterval: `${pollInterval}ms`,
    });

    while (Date.now() - startTime < timeoutMs) {
      try {
        const details = await this.getInstanceDetails(instanceId);

        if (details.state === 'running') {
          logger.info('Instance is now running', {
            instanceId,
            publicIp: details.publicIp,
            privateIp: details.privateIp,
            elapsedMs: Date.now() - startTime,
          });

          return {
            publicIp: details.publicIp,
            privateIp: details.privateIp,
            publicDnsName: details.publicDnsName,
          };
        }

        if (details.state === 'terminated' || details.state === 'shutting-down') {
          throw new AWSProvisioningError(
            `Instance ${instanceId} is ${details.state}`,
            'waitForInstanceRunning'
          );
        }

        logger.debug('Instance not ready yet', {
          instanceId,
          currentState: details.state,
          elapsedMs: Date.now() - startTime,
        });

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (error instanceof AWSProvisioningError) {
          throw error;
        }

        logger.error('Error while waiting for instance', {
          instanceId,
          error: error instanceof Error ? error.message : String(error),
        });

        // Continue polling unless it's a terminal error
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new AWSProvisioningError(
      `Instance ${instanceId} did not reach running state within ${timeoutMs}ms`,
      'waitForInstanceRunning'
    );
  }

  /**
   * Terminate an instance and cleanup resources
   */
  async terminateInstance(instanceId: string, keyPairName?: string): Promise<void> {
    try {
      logger.info('Terminating instance', { instanceId, keyPairName });

      // Terminate the instance
      const params: AWS.EC2.TerminateInstancesRequest = {
        InstanceIds: [instanceId],
      };

      await this.ec2.terminateInstances(params).promise();

      // Delete the key pair if provided
      if (keyPairName) {
        await this.deleteKeyPair(keyPairName);
      }

      logger.info('Instance terminated successfully', { instanceId });
    } catch (error) {
      const awsError = error as AWS.AWSError;
      logger.error('Failed to terminate instance', {
        instanceId,
        error: awsError.message,
        code: awsError.code,
      });

      throw new AWSProvisioningError(
        `Failed to terminate instance: ${awsError.message}`,
        'terminateInstances',
        awsError
      );
    }
  }

  /**
   * Delete a key pair
   */
  async deleteKeyPair(keyPairName: string): Promise<void> {
    try {
      const params: AWS.EC2.DeleteKeyPairRequest = {
        KeyName: keyPairName,
      };

      await this.ec2.deleteKeyPair(params).promise();
      logger.info('Key pair deleted', {
        keyPairName,
        region: this.config.region,
        awsRegion: this.ec2.config.region
      });
    } catch (error) {
      const awsError = error as AWS.AWSError;

      // Don't throw error if key pair doesn't exist
      if (awsError.code === 'InvalidKeyPair.NotFound') {
        logger.debug('Key pair not found (already deleted)', { keyPairName });
        return;
      }

      logger.error('Failed to delete key pair', {
        keyPairName,
        error: awsError.message,
        code: awsError.code,
      });

      throw new AWSProvisioningError(
        `Failed to delete key pair: ${awsError.message}`,
        'deleteKeyPair',
        awsError
      );
    }
  }

  /**
   * Cleanup resources after failed provisioning
   */
  private async cleanupFailedProvisioning(keyPairName: string): Promise<void> {
    try {
      // Delete AWS key pair
      await this.deleteKeyPair(keyPairName);

      // Delete local private key file
      const keyFilePath = sshKeyManager.getKeyFilePath(keyPairName);
      await sshKeyManager.deletePrivateKey(keyFilePath);

      logger.info('Cleanup completed after failed provisioning', { keyPairName });
    } catch (error) {
      logger.error('Error during cleanup', {
        keyPairName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List all instances with lab tags
   */
  async listLabInstances(): Promise<Array<{
    instanceId: string;
    state: string;
    publicIp?: string;
    userId?: string;
    labId?: string;
    enrollmentId?: string;
  }>> {
    try {
      const params: AWS.EC2.DescribeInstancesRequest = {
        Filters: [
          {
            Name: 'tag:Project',
            Values: ['ezshell-labs'],
          },
          {
            Name: 'instance-state-name',
            Values: ['pending', 'running', 'stopping', 'stopped'],
          },
        ],
      };

      const result = await this.ec2.describeInstances(params).promise();
      const instances: Array<any> = [];

      if (result.Reservations) {
        for (const reservation of result.Reservations) {
          if (reservation.Instances) {
            for (const instance of reservation.Instances) {
              const tags = instance.Tags || [];
              const getTagValue = (key: string) =>
                tags.find(tag => tag.Key === key)?.Value;

              instances.push({
                instanceId: instance.InstanceId!,
                state: parseInstanceState(instance.State?.Name || 'unknown'),
                publicIp: instance.PublicIpAddress,
                userId: getTagValue('UserId'),
                labId: getTagValue('LabId'),
                enrollmentId: getTagValue('EnrollmentId'),
              });
            }
          }
        }
      }

      return instances;
    } catch (error) {
      const awsError = error as AWS.AWSError;
      logger.error('Failed to list lab instances', {
        error: awsError.message,
        code: awsError.code,
      });

      throw new AWSProvisioningError(
        `Failed to list instances: ${awsError.message}`,
        'describeInstances',
        awsError
      );
    }
  }
}

// Export singleton instance
export const awsProvisionerService = new AWSProvisionerService();
