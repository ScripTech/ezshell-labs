import AWS from 'aws-sdk';

// AWS configuration interface
export interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  instanceType: string;
  amiId: string;
  securityGroupId: string;
  subnetId: string;
  keyPairPrefix: string;
}

// Get AWS configuration from environment variables
export const getAWSConfig = (): AWSConfig => {
  const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SECURITY_GROUP_ID',
    'AWS_SUBNET_ID'
  ];

  // Check for required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    instanceType: process.env.AWS_INSTANCE_TYPE || 't3.micro',
    amiId: process.env.AWS_AMI_ID || 'ami-0abcdef1234567890', // Amazon Linux 2
    securityGroupId: process.env.AWS_SECURITY_GROUP_ID!,
    subnetId: process.env.AWS_SUBNET_ID!,
    keyPairPrefix: process.env.AWS_KEY_PAIR_PREFIX || 'ezshell-lab',
  };
};

// Configure AWS SDK
export const configureAWS = (config: AWSConfig): void => {
  AWS.config.update({
    region: config.region,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });
};

// Create EC2 service instance
export const createEC2Instance = (config: AWSConfig): AWS.EC2 => {
  configureAWS(config);
  return new AWS.EC2({
    apiVersion: '2016-11-15',
    region: config.region,
  });
};

// EC2 instance configuration for lab environments
export interface EC2LaunchConfig {
  amiId: string;
  instanceType: string;
  keyName: string;
  securityGroupIds: string[];
  subnetId: string;
  userData: string;
  tags: AWS.EC2.TagList;
}

// Create launch configuration for lab instance
export const createLabInstanceConfig = (
  config: AWSConfig,
  userId: string,
  labId: string,
  enrollmentId: string,
  keyPairName: string
): EC2LaunchConfig => {
  // User data script to configure the instance
  const userData = Buffer.from(`#!/bin/bash
# EZShell Lab Instance Setup
yum update -y
yum install -y git curl wget nano vim htop

# Create lab user
useradd -m -s /bin/bash labuser
echo "labuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Configure SSH for lab user
mkdir -p /home/labuser/.ssh
chown labuser:labuser /home/labuser/.ssh
chmod 700 /home/labuser/.ssh

# Install additional tools for DevOps labs
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker labuser

# Install Python and pip
yum install -y python3 python3-pip

# Create lab workspace
mkdir -p /home/labuser/lab
chown labuser:labuser /home/labuser/lab

# Set up logging
echo "Lab instance ${enrollmentId} initialized at $(date)" >> /var/log/lab-setup.log

# Signal completion
echo "EZShell lab instance ready" > /home/labuser/READY
chown labuser:labuser /home/labuser/READY
`).toString('base64');

  return {
    amiId: config.amiId,
    instanceType: config.instanceType,
    keyName: keyPairName,
    securityGroupIds: [config.securityGroupId],
    subnetId: config.subnetId,
    userData,
    tags: [
      {
        Key: 'Name',
        Value: `EZShell-Lab-${userId}-${labId}`,
      },
      {
        Key: 'Environment',
        Value: 'lab',
      },
      {
        Key: 'Project',
        Value: 'ezshell-labs',
      },
      {
        Key: 'UserId',
        Value: userId,
      },
      {
        Key: 'LabId',
        Value: labId,
      },
      {
        Key: 'EnrollmentId',
        Value: enrollmentId,
      },
      {
        Key: 'CreatedBy',
        Value: 'lab-provisioner',
      },
      {
        Key: 'AutoTerminate',
        Value: 'true', // For automatic cleanup
      },
    ],
  };
};

// Instance state mapping
export const instanceStateMap = {
  pending: 'pending',
  running: 'running',
  'shutting-down': 'shutting-down',
  terminated: 'terminated',
  stopping: 'stopping',
  stopped: 'stopped',
} as const;

// Error handling for AWS operations
export class AWSProvisioningError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly awsError?: AWS.AWSError
  ) {
    super(message);
    this.name = 'AWSProvisioningError';
  }
}

// Utility functions
export const generateKeyPairName = (userId: string, labId: string): string => {
  const timestamp = Date.now();
  return `ezshell-lab-${userId}-${labId}-${timestamp}`;
};

export const parseInstanceState = (state: string): keyof typeof instanceStateMap => {
  return (state as keyof typeof instanceStateMap) || 'pending';
};

// Cleanup utilities
export const createCleanupTags = (hours: number = 2): AWS.EC2.TagList => {
  const terminateAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return [
    {
      Key: 'AutoTerminateAt',
      Value: terminateAt.toISOString(),
    },
    {
      Key: 'AutoTerminateHours',
      Value: hours.toString(),
    },
  ];
};
