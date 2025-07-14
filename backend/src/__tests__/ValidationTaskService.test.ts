import { ValidationTaskService } from '../services/ValidationTaskService';
import { NetworkValidationExecutor } from '../services/executors/NetworkValidationExecutor';
import { db, closeConnection } from '../db';
import { labTasks, labs } from '../db/schemas/LabSchema';
import { eq } from 'drizzle-orm';

describe('Service-Oriented Validation Architecture', () => {
  let validationService: ValidationTaskService;
  let networkExecutor: NetworkValidationExecutor;

  const mockLabId = 'test-lab-ex200';
  const mockTaskId = 'test-task-network-config';
  const mockUserId = 'test-user-123';

  beforeAll(async () => {
    // Initialize services
    validationService = new ValidationTaskService();
    networkExecutor = new NetworkValidationExecutor();

    // Register executors
    validationService.registerExecutor(networkExecutor);

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await closeConnection();
  });

  describe('ValidationTaskService', () => {
    test('should register validation executors correctly', () => {
      const availableTypes = validationService.getAvailableValidationTypes();

      expect(availableTypes).toContain('network_config');
      expect(availableTypes).toContain('firewall_rule');
      expect(availableTypes).toContain('ip_configuration');
    });

    test('should retrieve validation configuration from database', async () => {
      const config = await validationService.getTaskValidationConfig(mockTaskId);

      expect(config).not.toBeNull();
      expect(config?.steps).toHaveLength(3);
      expect(config?.totalPoints).toBe(10);
      expect(config?.passingScore).toBe(0.7);
    });

    test('should return null for non-existent task', async () => {
      const config = await validationService.getTaskValidationConfig('non-existent-task');
      expect(config).toBeNull();
    });

    test('should execute validation successfully', async () => {
      const context = {
        taskId: mockTaskId,
        userId: mockUserId,
        labId: mockLabId,
        sshConfig: {
          host: 'localhost',
          port: 22,
          username: 'test',
          password: 'test'
        }
      };

      const summary = await validationService.executeValidation(mockTaskId, context);

      expect(summary.taskId).toBe(mockTaskId);
      expect(summary.userId).toBe(mockUserId);
      expect(summary.totalSteps).toBe(3);
      expect(summary.results).toHaveLength(3);
      expect(summary.executedAt).toBeInstanceOf(Date);

      // All steps should pass with mock data
      expect(summary.passed).toBe(true);
      expect(summary.completedSteps).toBe(3);
      expect(summary.totalScore).toBe(10);
      expect(summary.maxScore).toBe(10);
    });

    test('should handle validation failures correctly', async () => {
      // Create a task with failing validation steps
      const failingTaskId = 'test-task-network-failing';
      await createFailingNetworkTask(failingTaskId);

      const context = {
        taskId: failingTaskId,
        userId: mockUserId,
        labId: mockLabId,
      };

      const summary = await validationService.executeValidation(failingTaskId, context);

      expect(summary.passed).toBe(false);
      expect(summary.completedSteps).toBeLessThan(summary.totalSteps);
      expect(summary.totalScore).toBeLessThan(summary.maxScore);

      // Clean up
      await db.delete(labTasks).where(eq(labTasks.id, failingTaskId));
    });
  });

  describe('NetworkValidationExecutor', () => {
    test('should validate IP configuration correctly', async () => {
      const step = {
        id: 'step-1',
        type: 'network_config',
        method: 'validateIPConfig',
        params: {
          interface: 'eth0',
          expectedIP: '192.168.1.100',
          expectedSubnet: '24',
          mockOutput: `
            2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
                inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
          `
        },
        weight: 3
      };

      const context = {
        taskId: mockTaskId,
        userId: mockUserId,
        labId: mockLabId
      };

      const result = await networkExecutor.executeStep(step, context);

      expect(result.success).toBe(true);
      expect(result.score).toBe(3);
      expect(result.maxScore).toBe(3);
      expect(result.message).toContain('IP configuration for eth0 is correct');
      expect(result.details?.expectedIP).toBe('192.168.1.100');
      expect(result.executionTime).toBeDefined();
    });

    test('should fail IP configuration validation with wrong IP', async () => {
      const step = {
        id: 'step-2',
        type: 'network_config',
        method: 'validateIPConfig',
        params: {
          interface: 'eth0',
          expectedIP: '192.168.1.100',
          expectedSubnet: '24',
          mockOutput: `
            2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
                inet 192.168.1.50/24 brd 192.168.1.255 scope global eth0
          `
        },
        weight: 3
      };

      const context = {
        taskId: mockTaskId,
        userId: mockUserId,
        labId: mockLabId
      };

      const result = await networkExecutor.executeStep(step, context);

      expect(result.success).toBe(false);
      expect(result.score).toBe(0);
      expect(result.maxScore).toBe(3);
      expect(result.message).toContain('IP configuration for eth0 is incorrect');
    });

    test('should validate firewall rules correctly', async () => {
      const step = {
        id: 'step-3',
        type: 'firewall_rule',
        method: 'validateFirewallRule',
        params: {
          port: '80',
          protocol: 'tcp',
          action: 'ACCEPT',
          mockOutput: `
            Chain INPUT (policy ACCEPT)
            target     prot opt source               destination
            ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:80
          `
        },
        weight: 2
      };

      const context = {
        taskId: mockTaskId,
        userId: mockUserId,
        labId: mockLabId
      };

      const result = await networkExecutor.executeStep(step, context);

      expect(result.success).toBe(true);
      expect(result.score).toBe(2);
      expect(result.message).toContain('Firewall rule for tcp:80 (ACCEPT) is configured correctly');
    });

    test('should handle unknown validation methods', async () => {
      const step = {
        id: 'step-4',
        type: 'network_config',
        method: 'unknownMethod',
        params: {},
        weight: 1
      };

      const context = {
        taskId: mockTaskId,
        userId: mockUserId,
        labId: mockLabId
      };

      const result = await networkExecutor.executeStep(step, context);

      expect(result.success).toBe(false);
      expect(result.score).toBe(0);
      expect(result.message).toContain('Unknown network validation method: unknownMethod');
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test lab
    await db.insert(labs).values({
      id: mockLabId,
      name: 'Test EX200 Lab',
      description: 'Test lab for service-oriented validation',
      duration: 60
    });

    // Create test task with validation configuration
    await db.insert(labTasks).values({
      id: mockTaskId,
      labId: mockLabId,
      order: 1,
      title: 'Network Configuration Task',
      description: 'Configure network settings',
      difficulty: 'medium',
      points: 10,
      validationSteps: {
        steps: [
          {
            id: 'step-1',
            type: 'network_config',
            method: 'validateIPConfig',
            description: 'Validate IP configuration for eth0',
            weight: 4,
            params: {
              interface: 'eth0',
              expectedIP: '192.168.1.100',
              expectedSubnet: '24',
              mockOutput: `
                2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
                    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
              `
            }
          },
          {
            id: 'step-2',
            type: 'firewall_rule',
            method: 'validateFirewallRule',
            description: 'Validate HTTP firewall rule',
            weight: 3,
            params: {
              port: '80',
              protocol: 'tcp',
              action: 'ACCEPT',
              mockOutput: `
                Chain INPUT (policy ACCEPT)
                target     prot opt source               destination
                ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:80
              `
            }
          },
          {
            id: 'step-3',
            type: 'ip_configuration',
            method: 'validateNetworkInterface',
            description: 'Validate network interface state',
            weight: 3,
            params: {
              interface: 'eth0',
              expectedState: 'up',
              mockOutput: 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500'
            }
          }
        ],
        passingScore: 0.7
      }
    });
  }

  async function createFailingNetworkTask(taskId: string) {
    await db.insert(labTasks).values({
      id: taskId,
      labId: mockLabId,
      order: 2,
      title: 'Failing Network Task',
      description: 'Task designed to fail',
      points: 10,
      validationSteps: {
        steps: [
          {
            id: 'fail-step-1',
            type: 'network_config',
            method: 'validateIPConfig',
            weight: 5,
            params: {
              interface: 'eth0',
              expectedIP: '192.168.1.100',
              expectedSubnet: '24',
              mockOutput: 'eth0: interface not found'
            }
          },
          {
            id: 'fail-step-2',
            type: 'firewall_rule',
            method: 'validateFirewallRule',
            weight: 5,
            params: {
              port: '80',
              protocol: 'tcp',
              action: 'ACCEPT',
              mockOutput: 'Chain INPUT (policy DROP)'
            }
          }
        ],
        passingScore: 0.7
      }
    });
  }

  async function cleanupTestData() {
    await db.delete(labTasks).where(eq(labTasks.labId, mockLabId));
    await db.delete(labs).where(eq(labs.id, mockLabId));
  }
});
