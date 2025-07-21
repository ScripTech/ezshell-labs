"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const socketAuth_1 = require("./middleware/socketAuth");
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
const AdditionalValidationController_1 = require("./controllers/labs/ex200/AdditionalValidationController");
const LVMConfigurationController_1 = require("./controllers/labs/ex200/LVMConfigurationController");
const SwapConfigurationController_1 = require("./controllers/labs/ex200/SwapConfigurationController");
const LVMResizeController_1 = require("./controllers/labs/ex200/LVMResizeController");
const VDOConfigurationController_1 = require("./controllers/labs/ex200/VDOConfigurationController");
const AdvancedContainerController_1 = require("./controllers/labs/ex200/AdvancedContainerController");
const FindUserFilesController_1 = require("./controllers/labs/ex200/FindUserFilesController");
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
const DynamicPtySessionFactory_1 = require("./services/DynamicPtySessionFactory");
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
app.use('/ws/api', api_1.default);
const port = Number.parseInt(process.env.SERVER_PORT) ?? 3001;
const host = process.env.SERVER_WSHOST ?? "localhost";
const httpSocketServer = new socket_io_1.Server({
    cors: {
        origin: "*",
    },
});
// Add authentication middleware for Socket.IO
httpSocketServer.use(socketAuth_1.socketAuthMiddleware);
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
const additionalController = new AdditionalValidationController_1.AdditionalValidationController();
const lvmController = new LVMConfigurationController_1.LVMConfigurationController();
const swapController = new SwapConfigurationController_1.SwapConfigurationController();
const lvmResizeController = new LVMResizeController_1.LVMResizeController();
const vdoController = new VDOConfigurationController_1.VDOConfigurationController();
const advancedContainerController = new AdvancedContainerController_1.AdvancedContainerController();
const findUserFilesController = new FindUserFilesController_1.FindUserFilesController();
const ex200Handler = new EX200ValidationHandler_1.EX200ValidationHandler(networkConfigValidationController, userGroupMnt, yumManagement, selinuxMnt, collabDirV1, cronJob, autofsConfig, basicController, additionalController, lvmController, swapController, lvmResizeController, vdoController, advancedContainerController, findUserFilesController);
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
httpSocketServer.on("connection", async (socket) => {
    console.log(`Client connected to Socket server - User: ${socket.user?.sub} (${socket.user?.email})`);
    // Enhanced WebSocket Service handles all the new features automatically
    // The EnhancedWebSocketService constructor sets up all event handlers
    // Extract lab parameters from handshake query
    const query = socket.handshake.query;
    const labId = query.lab;
    const sessionId = query.session;
    const userId = socket.user?.sub;
    console.log(`Connection parameters - Lab: ${labId}, Session: ${sessionId}, User: ${userId}`);
    let ptySession = null;
    try {
        if (labId && userId) {
            // Dynamic lab connection
            console.log(`Creating dynamic lab session for lab ${labId}, user ${userId}`);
            ptySession = await DynamicPtySessionFactory_1.PtySessionFactory.createLabSession(socket, {
                labId,
                cols: 80,
                rows: 60
            });
            if (ptySession) {
                // Emit lab connection status
                socket.emit("lab-connection-status", {
                    status: "connected",
                    labId,
                    message: "Connected to your provisioned lab environment"
                });
            }
            else {
                // Factory returned null, create fallback session
                throw new Error("Lab session creation failed");
            }
        }
        else {
            // Fallback to static configuration for backwards compatibility
            console.log("Using fallback static SSH configuration");
            ptySession = new PtySession_1.PtySession(socket, {
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
        }
    }
    catch (error) {
        console.error("Failed to create PTY session:", error);
        // Emit error to client
        socket.emit("lab-connection-status", {
            status: "error",
            labId,
            error: error instanceof Error ? error.message : "Unknown connection error"
        });
        // Fallback to static configuration
        console.log("Falling back to static SSH configuration due to error");
        ptySession = new PtySession_1.PtySession(socket, {
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
    }
    // Ensure we have a PTY session before proceeding
    if (!ptySession) {
        console.error("Failed to create any PTY session - this should not happen");
        socket.emit("lab-connection-status", {
            status: "error",
            error: "Failed to establish terminal connection"
        });
        return;
    }
    socket.emit("connected", {
        message: "Connected to the terminal service with enhanced features",
        features: {
            progressPersistence: true,
            realtimeAnalytics: true,
            stepByStepValidation: true,
            learningInsights: true,
            adminDashboard: true,
            dynamicLabConnections: true
        },
        labConnection: labId ? {
            labId,
            sessionId,
            connectionType: "dynamic"
        } : {
            connectionType: "static"
        }
    });
    // Add lab status check event handler
    socket.on("check-lab-status", async ({ labId: checkLabId }) => {
        const userId = socket.user?.sub;
        if (!userId) {
            socket.emit("lab-status-error", { error: "Authentication required" });
            return;
        }
        try {
            const status = await DynamicPtySessionFactory_1.PtySessionFactory.getLabStatus(checkLabId, userId);
            socket.emit("lab-status", status);
        }
        catch (error) {
            console.error("Error checking lab status:", error);
            socket.emit("lab-status-error", {
                error: error instanceof Error ? error.message : "Unknown error",
                labId: checkLabId
            });
        }
    });
    // Add lab readiness check event handler
    socket.on("check-lab-ready", async ({ labId: checkLabId }) => {
        const userId = socket.user?.sub;
        if (!userId) {
            socket.emit("lab-ready-error", { error: "Authentication required" });
            return;
        }
        try {
            const isReady = await DynamicPtySessionFactory_1.PtySessionFactory.isLabReady(checkLabId, userId);
            socket.emit("lab-ready", {
                labId: checkLabId,
                ready: isReady,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error("Error checking lab readiness:", error);
            socket.emit("lab-ready-error", {
                error: error instanceof Error ? error.message : "Unknown error",
                labId: checkLabId
            });
        }
    });
    // Legacy validation support (maintained for backward compatibility)
    socket.on("validate-exercise", async ({ id, labId, questionId, validationQuestionId }) => {
        const userId = socket.user?.sub;
        console.info("Validating exercise for lab:", labId, "labID: ", id, "question:", questionId, "validationQuestionId:", validationQuestionId, "user:", userId);
        const handler = validationHandlerFactory.getHandler(labId.toLowerCase());
        if (handler) {
            await handler.handleValidation(socket, questionId, id, validationQuestionId);
        }
        else {
            console.log(`No handler found for lab: ${labId}`);
        }
    });
    // Enhanced Service-Oriented validation with progress persistence
    socket.on("validate-task", async ({ taskId, labId, sessionData }) => {
        const userId = socket.user?.sub;
        if (!userId) {
            socket.emit('validation-error', {
                taskId,
                error: 'Authentication required',
                timestamp: new Date().toISOString()
            });
            return;
        }
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
    socket.on("request-progress-summary", async ({ labId }) => {
        const userId = socket.user?.sub;
        if (!userId) {
            socket.emit('progress-error', { message: 'Authentication required' });
            return;
        }
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
    socket.on("terminal-command", async ({ command, output, exitCode }) => {
        const userId = socket.user?.sub;
        if (!userId)
            return;
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
