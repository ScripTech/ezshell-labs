import express from "express";
import { Server } from "socket.io";
import { ValidationController } from "./controllers/labs/ex200/validationController";
import ssh2 from "ssh2";
import dotenv from "dotenv";
import { NetworkConfigValidationController } from "./controllers/labs/ex200/NetworkConfigValidationController";
import { UserGroupManagementController } from "./controllers/labs/ex200/UserGroupManagementController";
import { YumRepositoryValidationController } from "./controllers/labs/ex200/YumRepositoryValidationController";
import { SELinuxManagementController } from "./controllers/labs/ex200/SELinuxManagementController";
import { CollaborativeDirectoryControllerV1 } from "./controllers/labs/ex200/CollaborativeDirectoryControllerV1";
import { CronJobController } from "./controllers/labs/ex200/CronJobController";
import { AutofsConfigurationController } from "./controllers/labs/ex200/AutofsConfigurationController";
import { BasicValidationController } from "./controllers/labs/ex200/BasicValidationController";
import { EX200ValidationHandler } from "./handlers/EX200ValidationHandler";
import { EX280ValidationHandler } from "./handlers/EX280ValidationHandler";
import { LabValidationHandlerFactory } from "./handlers/LabValidationHandlerFactory";
import { AuthenticationManagementController, EX280OCPDeploymentController } from "./controllers/labs/ex280";
import { GroupRoleManagementController } from "./controllers/labs/ex280/GroupRoleManagementController";
import { DO280ValidationHandler } from './handlers/DO280ValidationHandler';
import { IdentityProvidersController } from "./controllers/labs/do280/IdentityProvidersController";
import { ProjectPermissionController } from "./controllers/labs/do280/ProjectPermissionController";
import { GroupManagementController } from "./controllers/labs/do280/GroupManagementController";
import { ResourceQuotaController } from "./controllers/labs/do280/ResourceQuotaController";
import { LimitRangeController } from './controllers/labs/do280/LimitRangeController';
import { DeploymentController } from './controllers/labs/do280/DeploymentController';
import { ScalingController } from './controllers/labs/do280/ScalingController';
import { AutoScalingController } from "./controllers/labs/do280/AutoScalingController";
import { PtySession } from "./terminal/PtySession";
import { ServiceOrientedValidationHandler } from "./handlers/ServiceOrientedValidationHandler";
import { EnhancedWebSocketService } from "./services/EnhancedWebSocketService";
import { ValidationTaskService } from "./services/ValidationTaskService";
import { progressService } from "./services/ProgressService";
import apiRoutes from "./routes/api";

dotenv.config();

const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

const port = Number.parseInt(process.env.SERVER_PORT!) ?? 3001;
const host = process.env.SERVER_WSHOST! ?? "localhost";

const httpSocketServer = new Server({
  cors: {
    origin: "*",
  },
});

const validationController = new ValidationController();
const networkConfigValidationController = new NetworkConfigValidationController();
const userGroupMnt = new UserGroupManagementController();
const yumManagement = new YumRepositoryValidationController();
const selinuxMnt = new SELinuxManagementController();
const collabDirV1 = new CollaborativeDirectoryControllerV1();
const cronJob = new CronJobController();
const autofsConfig = new AutofsConfigurationController();
const basicController = new BasicValidationController();

const ex280DeploymentController = new EX280OCPDeploymentController();
const authController = new AuthenticationManagementController()
const groupRoleController = new GroupRoleManagementController();

// DO280 Controllers
const identityProvidersController = new IdentityProvidersController()
const projectPermissionController = new ProjectPermissionController();
const groupManagementController = new GroupManagementController();
const resourceQuotaController = new ResourceQuotaController();
const limitRangeController = new LimitRangeController();
const scalingController = new ScalingController();
const deploymentController = new DeploymentController();
const autoScalingController = new AutoScalingController();

// Initialize handlers
const ex200Handler = new EX200ValidationHandler(
  networkConfigValidationController,
  userGroupMnt,
  yumManagement,
  selinuxMnt,
  collabDirV1,
  cronJob,
  autofsConfig,
  basicController
);

const ex280Handler = new EX280ValidationHandler(
  authController,
  groupRoleController
);


const do280Handler = new DO280ValidationHandler(
  identityProvidersController,
  projectPermissionController,
  groupManagementController,
  resourceQuotaController,
  limitRangeController,
  scalingController,
  deploymentController,
  autoScalingController
);

// Initialize factory
const validationHandlerFactory = new LabValidationHandlerFactory(
  ex200Handler,
  ex280Handler,
  do280Handler
);

// Initialize new Service-Oriented validation handler
const serviceOrientedHandler = new ServiceOrientedValidationHandler();

// Initialize Enhanced WebSocket Service with advanced features
const validationTaskService = new ValidationTaskService();
const enhancedWebSocketService = new EnhancedWebSocketService(httpSocketServer, validationTaskService);

console.log('✅ Enhanced WebSocket Service initialized with progress persistence and real-time analytics');

httpSocketServer.on("connection", (socket) => {
  console.log("Client connected to Socket server");

  // Enhanced WebSocket Service handles all the new features automatically
  // The EnhancedWebSocketService constructor sets up all event handlers

  // Example: Use SSH session
  const ptySession = new PtySession(socket, {
    type: "ssh",
    cols: 80,
    rows: 60,
    sshConfig: {
      host: process.env.LAB_SSH_HOST!,
      port: Number.parseInt(process.env.LAB_SSH_PORT!) ?? 22,
      username: process.env.LAB_SSH_USERNAME ?? "lab-user",
      password: process.env.LAB_SSH_PASSWORD ?? "password",
    },
  });

  socket.emit("connected", {
    message: "Connected to the terminal service with enhanced features",
    features: {
      progressPersistence: true,
      realtimeAnalytics: true,
      stepByStepValidation: true,
      learningInsights: true,
      adminDashboard: true
    }
  });

  // Legacy validation support (maintained for backward compatibility)
  socket.on("validate-exercise", async ({ labId, questionId }) => {
    console.info("Validating exercise for lab:", labId, "question:", questionId);

    const handler = validationHandlerFactory.getHandler(labId);
    if (handler) {
      await handler.handleValidation(socket, questionId);
    } else {
      console.log(`No handler found for lab: ${labId}`);
    }
  });

  // Enhanced Service-Oriented validation with progress persistence
  socket.on("validate-task", async ({ taskId, labId, userId, sessionData }) => {
    console.info("Service-Oriented validation for task:", taskId, "lab:", labId, "user:", userId);

    try {
      // Log the validation start event for analytics
      const sessionId = enhancedWebSocketService.getUserSession(userId);
      if (sessionId) {
        await progressService.logRealtimeEvent(
          userId,
          sessionId,
          'task-validation-start',
          { taskId, labId, sessionData },
          socket.id
        );
      }

      await serviceOrientedHandler.handleValidation(socket, taskId, {
        labId,
        userId,
        sessionData
      });
    } catch (error) {
      console.error("Service-Oriented validation error:", error);
      socket.emit('validation-error', {
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Enhanced progress tracking endpoints
  socket.on("request-progress-summary", async ({ userId, labId }) => {
    try {
      const insights = await progressService.getLearningInsights(userId, labId);
      const activeSession = await progressService.getActiveSession(userId, labId);

      socket.emit('progress-summary', {
        insights,
        activeSession,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('progress-error', { message: 'Failed to retrieve progress summary' });
    }
  });

  // Real-time command tracking for enhanced analytics
  socket.on("terminal-command", async ({ userId, command, output, exitCode }) => {
    try {
      const sessionId = enhancedWebSocketService.getUserSession(userId);
      if (sessionId) {
        await progressService.logRealtimeEvent(
          userId,
          sessionId,
          'command-executed',
          { command, output, exitCode },
          socket.id
        );
      }
    } catch (error) {
      console.error("Failed to log command execution:", error);
    }
  });

  // Enhanced disconnect handling with session cleanup
  socket.on("disconnect", () => {
    ptySession.dispose();

    // The EnhancedWebSocketService handles user session cleanup automatically
    console.log("Client disconnected - session cleanup handled by EnhancedWebSocketService");
  });

  // Legacy validation handler (maintained for compatibility)
  socket.on("validate", (username) => {
    validationController.handleValidation(socket, username);
  });
});

httpSocketServer.listen(
  app.listen(port, () => {
    console.log(`WebSocket validation API listening at http://${host}:${port}`);
  })
);
