"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const validationController_1 = require("./controllers/labs/ex200/validationController");
const dotenv_1 = __importDefault(require("dotenv"));
const NetworkConfigValidationController_1 = require("./controllers/labs/ex200/NetworkConfigValidationController");
const UserGroupManagementController_1 = require("./controllers/labs/ex200/UserGroupManagementController");
const YumRepositoryValidationController_1 = require("./controllers/labs/ex200/YumRepositoryValidationController");
const SELinuxManagementController_1 = require("./controllers/labs/ex200/SELinuxManagementController");
const CollaborativeDirectoryControllerV1_1 = require("./controllers/labs/ex200/CollaborativeDirectoryControllerV1");
const CronJobController_1 = require("./controllers/labs/ex200/CronJobController");
const AutofsConfigurationController_1 = require("./controllers/labs/ex200/AutofsConfigurationController");
const BasicValidationController_1 = require("./controllers/labs/ex200/BasicValidationController");
const EX200ValidationHandler_1 = require("./handlers/EX200ValidationHandler");
const EX280ValidationHandler_1 = require("./handlers/EX280ValidationHandler");
const LabValidationHandlerFactory_1 = require("./handlers/LabValidationHandlerFactory");
const ex280_1 = require("./controllers/labs/ex280");
const GroupRoleManagementController_1 = require("./controllers/labs/ex280/GroupRoleManagementController");
const DO280ValidationHandler_1 = require("./handlers/DO280ValidationHandler");
const IdentityProvidersController_1 = require("./controllers/labs/do280/IdentityProvidersController");
const ProjectPermissionController_1 = require("./controllers/labs/do280/ProjectPermissionController");
const GroupManagementController_1 = require("./controllers/labs/do280/GroupManagementController");
const ResourceQuotaController_1 = require("./controllers/labs/do280/ResourceQuotaController");
const LimitRangeController_1 = require("./controllers/labs/do280/LimitRangeController");
const DeploymentController_1 = require("./controllers/labs/do280/DeploymentController");
const ScalingController_1 = require("./controllers/labs/do280/ScalingController");
const AutoScalingController_1 = require("./controllers/labs/do280/AutoScalingController");
const PtySession_1 = require("./terminal/PtySession");
const ServiceOrientedValidationHandler_1 = require("./handlers/ServiceOrientedValidationHandler");
const EnhancedWebSocketService_1 = require("./services/EnhancedWebSocketService");
const ValidationTaskService_1 = require("./services/ValidationTaskService");
const ProgressService_1 = require("./services/ProgressService");
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const cors = require("cors");
const app = (0, express_1.default)();
// Middleware
app.use(cors());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api', api_1.default);
const port = Number.parseInt(process.env.SERVER_PORT) ?? 3001;
const host = process.env.SERVER_WSHOST ?? "localhost";
const httpSocketServer = new socket_io_1.Server({
    cors: {
        origin: "*",
    },
});
const validationController = new validationController_1.ValidationController();
const networkConfigValidationController = new NetworkConfigValidationController_1.NetworkConfigValidationController();
const userGroupMnt = new UserGroupManagementController_1.UserGroupManagementController();
const yumManagement = new YumRepositoryValidationController_1.YumRepositoryValidationController();
const selinuxMnt = new SELinuxManagementController_1.SELinuxManagementController();
const collabDirV1 = new CollaborativeDirectoryControllerV1_1.CollaborativeDirectoryControllerV1();
const cronJob = new CronJobController_1.CronJobController();
const autofsConfig = new AutofsConfigurationController_1.AutofsConfigurationController();
const basicController = new BasicValidationController_1.BasicValidationController();
const ex280DeploymentController = new ex280_1.EX280OCPDeploymentController();
const authController = new ex280_1.AuthenticationManagementController();
const groupRoleController = new GroupRoleManagementController_1.GroupRoleManagementController();
// DO280 Controllers
const identityProvidersController = new IdentityProvidersController_1.IdentityProvidersController();
const projectPermissionController = new ProjectPermissionController_1.ProjectPermissionController();
const groupManagementController = new GroupManagementController_1.GroupManagementController();
const resourceQuotaController = new ResourceQuotaController_1.ResourceQuotaController();
const limitRangeController = new LimitRangeController_1.LimitRangeController();
const scalingController = new ScalingController_1.ScalingController();
const deploymentController = new DeploymentController_1.DeploymentController();
const autoScalingController = new AutoScalingController_1.AutoScalingController();
// Initialize handlers
const ex200Handler = new EX200ValidationHandler_1.EX200ValidationHandler(networkConfigValidationController, userGroupMnt, yumManagement, selinuxMnt, collabDirV1, cronJob, autofsConfig, basicController);
const ex280Handler = new EX280ValidationHandler_1.EX280ValidationHandler(authController, groupRoleController);
const do280Handler = new DO280ValidationHandler_1.DO280ValidationHandler(identityProvidersController, projectPermissionController, groupManagementController, resourceQuotaController, limitRangeController, scalingController, deploymentController, autoScalingController);
// Initialize factory
const validationHandlerFactory = new LabValidationHandlerFactory_1.LabValidationHandlerFactory(ex200Handler, ex280Handler, do280Handler);
// Initialize new Service-Oriented validation handler
const serviceOrientedHandler = new ServiceOrientedValidationHandler_1.ServiceOrientedValidationHandler();
// Initialize Enhanced WebSocket Service with advanced features
const validationTaskService = new ValidationTaskService_1.ValidationTaskService();
const enhancedWebSocketService = new EnhancedWebSocketService_1.EnhancedWebSocketService(httpSocketServer, validationTaskService);
console.log('✅ Enhanced WebSocket Service initialized with progress persistence and real-time analytics');
httpSocketServer.on("connection", (socket) => {
    console.log("Client connected to Socket server");
    // Enhanced WebSocket Service handles all the new features automatically
    // The EnhancedWebSocketService constructor sets up all event handlers
    // Example: Use SSH session
    const ptySession = new PtySession_1.PtySession(socket, {
        type: "ssh",
        cols: 80,
        rows: 60,
        sshConfig: {
            host: process.env.LAB_SSH_HOST,
            port: Number.parseInt(process.env.LAB_SSH_PORT) ?? 22,
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
        }
        else {
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
                await ProgressService_1.progressService.logRealtimeEvent(userId, sessionId, 'task-validation-start', { taskId, labId, sessionData }, socket.id);
            }
            await serviceOrientedHandler.handleValidation(socket, taskId, {
                labId,
                userId,
                sessionData
            });
        }
        catch (error) {
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
            const insights = await ProgressService_1.progressService.getLearningInsights(userId, labId);
            const activeSession = await ProgressService_1.progressService.getActiveSession(userId, labId);
            socket.emit('progress-summary', {
                insights,
                activeSession,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            socket.emit('progress-error', { message: 'Failed to retrieve progress summary' });
        }
    });
    // Real-time command tracking for enhanced analytics
    socket.on("terminal-command", async ({ userId, command, output, exitCode }) => {
        try {
            const sessionId = enhancedWebSocketService.getUserSession(userId);
            if (sessionId) {
                await ProgressService_1.progressService.logRealtimeEvent(userId, sessionId, 'command-executed', { command, output, exitCode }, socket.id);
            }
        }
        catch (error) {
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
httpSocketServer.listen(app.listen(port, () => {
    console.log(`WebSocket validation API listening at http://${host}:${port}`);
}));
