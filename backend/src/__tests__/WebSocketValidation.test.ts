import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { db, closeConnection } from '../db';
import { labTasks, labs } from '../db/schemas/LabSchema';
import { eq } from 'drizzle-orm';

describe('WebSocket Service-Oriented Validation Integration', () => {
  let httpServer: any;
  let httpServerAddr: AddressInfo;
  let ioServer: Server;
  let clientSocket: ClientSocket;

  const mockLabId = 'test-lab-websocket';
  const mockTaskId = 'test-task-websocket';
  const mockUserId = 'test-user-websocket';

  beforeAll(async () => {
    // Create HTTP server and Socket.IO server
    httpServer = createServer();
    ioServer = new Server(httpServer);

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        httpServerAddr = httpServer.address() as AddressInfo;
        resolve();
      });
    });

    // Set up WebSocket handlers (simplified version of our main server)
    ioServer.on('connection', async (socket) => {
      const { ServiceOrientedValidationHandler } = await import('../handlers/ServiceOrientedValidationHandler');
      const serviceOrientedHandler = new ServiceOrientedValidationHandler();

      socket.on('validate-task', async ({ taskId, labId, userId, sessionData }) => {
        try {
          await serviceOrientedHandler.handleValidation(socket, taskId, {
            labId,
            userId,
            sessionData
          });
        } catch (error) {
          socket.emit('validation-error', {
            taskId,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    // Set up test data
    await setupTestData();
  });

  beforeEach(async () => {
    // Create client connection
    clientSocket = Client(`http://localhost:${httpServerAddr.port}`);

    // Wait for connection
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  afterAll(async () => {
    // Clean up
    await cleanupTestData();
    await closeConnection();

    ioServer.close();
    httpServer.close();
  });

  test('should emit validation events in correct sequence', async () => {
    const events: any[] = [];

    // Listen to all validation events
    clientSocket.on('validation-started', (data) => events.push({ type: 'started', data }));
    clientSocket.on('validation-progress', (data) => events.push({ type: 'progress', data }));
    clientSocket.on('validation-step-started', (data) => events.push({ type: 'step-started', data }));
    clientSocket.on('validation-step-completed', (data) => events.push({ type: 'step-completed', data }));
    clientSocket.on('validation-completed', (data) => events.push({ type: 'completed', data }));
    clientSocket.on('validation-result', (data) => events.push({ type: 'result', data }));
    clientSocket.on('validation-error', (data) => events.push({ type: 'error', data }));

    // Trigger validation
    clientSocket.emit('validate-task', {
      taskId: mockTaskId,
      labId: mockLabId,
      userId: mockUserId,
      sessionData: { testMode: true }
    });

    // Wait for validation to complete
    await new Promise<void>((resolve) => {
      clientSocket.on('validation-completed', () => resolve());
    });

    // Allow some time for all events
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify event sequence
    expect(events.length).toBeGreaterThan(0);

    // Check that we got the expected events
    const eventTypes = events.map(e => e.type);
    expect(eventTypes).toContain('started');
    expect(eventTypes).toContain('progress');
    expect(eventTypes).toContain('step-started');
    expect(eventTypes).toContain('step-completed');
    expect(eventTypes).toContain('completed');
    expect(eventTypes).toContain('result'); // backward compatibility

    // Verify validation started event
    const startedEvent = events.find(e => e.type === 'started');
    expect(startedEvent.data.taskId).toBe(mockTaskId);

    // Verify validation completed event
    const completedEvent = events.find(e => e.type === 'completed');
    expect(completedEvent.data.taskId).toBe(mockTaskId);
    expect(completedEvent.data.userId).toBe(mockUserId);
    expect(completedEvent.data.summary).toBeDefined();
    expect(completedEvent.data.summary.totalSteps).toBe(2);

    // Verify backward compatibility event
    const resultEvent = events.find(e => e.type === 'result');
    expect(resultEvent.data.labId).toBe(mockLabId);
    expect(resultEvent.data.questionId).toBe(mockTaskId);
    expect(resultEvent.data.success).toBeDefined();
  }, 10000);

  test('should provide real-time step-by-step progress', async () => {
    const stepEvents: any[] = [];

    clientSocket.on('validation-step-started', (data) => stepEvents.push({ type: 'started', data }));
    clientSocket.on('validation-step-completed', (data) => stepEvents.push({ type: 'completed', data }));

    // Trigger validation
    clientSocket.emit('validate-task', {
      taskId: mockTaskId,
      labId: mockLabId,
      userId: mockUserId
    });

    // Wait for validation to complete
    await new Promise<void>((resolve) => {
      clientSocket.on('validation-completed', () => resolve());
    });

    // Verify we got step events for each validation step
    const startedSteps = stepEvents.filter(e => e.type === 'started');
    const completedSteps = stepEvents.filter(e => e.type === 'completed');

    expect(startedSteps.length).toBe(2); // Our test task has 2 steps
    expect(completedSteps.length).toBe(2);

    // Verify step details
    startedSteps.forEach((step, index) => {
      expect(step.data.taskId).toBe(mockTaskId);
      expect(step.data.stepNumber).toBe(index + 1);
      expect(step.data.totalSteps).toBe(2);
      expect(step.data.description).toBeDefined();
    });

    completedSteps.forEach((step) => {
      expect(step.data.taskId).toBe(mockTaskId);
      expect(step.data.success).toBeDefined();
      expect(step.data.score).toBeDefined();
      expect(step.data.maxScore).toBeDefined();
      expect(step.data.message).toBeDefined();
    });
  }, 10000);

  test('should handle validation errors gracefully', async () => {
    const errorEvents: any[] = [];

    clientSocket.on('validation-error', (data) => errorEvents.push(data));

    // Trigger validation with non-existent task
    clientSocket.emit('validate-task', {
      taskId: 'non-existent-task',
      labId: mockLabId,
      userId: mockUserId
    });

    // Wait for error
    await new Promise<void>((resolve) => {
      clientSocket.on('validation-error', () => resolve());
    });

    expect(errorEvents.length).toBe(1);
    expect(errorEvents[0].error).toContain('Task validation configuration not found');
  }, 5000);

  // Helper functions
  async function setupTestData() {
    // Create test lab
    await db.insert(labs).values({
      id: mockLabId,
      name: 'Test WebSocket Lab',
      description: 'Test lab for WebSocket validation',
      duration: 60
    });

    // Create test task with validation configuration
    await db.insert(labTasks).values({
      id: mockTaskId,
      labId: mockLabId,
      order: 1,
      title: 'WebSocket Validation Task',
      description: 'Test task for WebSocket validation',
      difficulty: 'easy',
      points: 10,
      validationSteps: {
        steps: [
          {
            id: 'ws-step-1',
            type: 'network_config',
            method: 'validateIPConfig',
            description: 'Validate IP configuration',
            weight: 5,
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
            id: 'ws-step-2',
            type: 'firewall_rule',
            method: 'validateFirewallRule',
            description: 'Validate firewall rule',
            weight: 5,
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
