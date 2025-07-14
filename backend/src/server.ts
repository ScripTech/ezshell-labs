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

httpSocketServer.on("connection", (socket) => {
  console.log("Client connected to Socket server");

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
    message: "Connected to the terminal service",
  });

  socket.on("disconnect", () => {
    ptySession.dispose();
    console.log("A user disconnected");
  });

  // question validation block

  socket.on("validate-exercise", async ({ labId, questionId }) => {
    console.info("Validating exercise for lab:", labId, "question:", questionId);

    const handler = validationHandlerFactory.getHandler(labId);
    if (handler) {
      await handler.handleValidation(socket, questionId);
    } else {
      console.log(`No handler found for lab: ${labId}`);
    }
  });

  // end block

  socket.on("validate", (username) => {
    validationController.handleValidation(socket, username);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

httpSocketServer.listen(
  app.listen(port, () => {
    console.log(`WebSocket validation API listening at http://${host}:${port}`);
  })
);
