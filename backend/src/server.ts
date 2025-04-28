import express from "express";
import { Server } from "socket.io";
import { ValidationController } from "./controllers/validationController";
import ssh2 from "ssh2";
import dotenv from "dotenv";
import { NetworkConfigValidationController } from "./controllers/exercises/NetworkConfigValidationController";
import { UserGroupManagementController } from "./controllers/exercises/UserGroupManagementController";
import { YumRepositoryValidationController } from "./controllers/exercises/YumRepositoryValidationController";
import { SELinuxManagementController } from "./controllers/exercises/SELinuxManagementController";
import { CollaborativeDirectoryControllerV1 } from "./controllers/exercises/CollaborativeDirectoryControllerV1";
import { CronJobController } from "./controllers/exercises/CronJobController";
import { AutofsConfigurationController } from "./controllers/exercises/AutofsConfigurationController";
import { BasicValidationController } from "./controllers/exercises/BasicValidationController";
import { EX280OCPDeploymentController } from './controllers/labs/ex280/EX280OCPDeploymentController';
import { EX200ValidationHandler } from "./handlers/EX200ValidationHandler";
import { EX280ValidationHandler } from "./handlers/EX280ValidationHandler";
import { LabValidationHandlerFactory } from "./handlers/LabValidationHandlerFactory";

dotenv.config();

const cors = require("cors");
const app = express();
const port = Number.parseInt(process.env.SERVER_PORT!) ?? 3001;
const host = Number.parseInt(process.env.SERVER_WSHOST!) ?? 'localhost';

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
  ex280DeploymentController
);

// Initialize factory
const validationHandlerFactory = new LabValidationHandlerFactory(
  ex200Handler,
  ex280Handler
);

httpSocketServer.on("connection", (socket) => {
  console.log("Client connected to Socket server");

  const conn = new ssh2.Client();
  conn.connect({
    host: process.env.LAB_SSH_HOST,
    port: Number.parseInt(process.env.LAB_SSH_PORT!) ?? 22,
    username: process.env.LAB_SSH_USERNAME ?? "lab-user",
    password: process.env.LAB_SSH_PASSWORD ?? "password",
  });

  conn.on("connect", () => {
    console.log("Connecting to SSH server...");
  })

  conn.on("ready", () => {
    console.log("SSH CONNECTION ESTABLISHED");
    socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
    conn.shell((err, stream) => {
      if (err)
        return socket.emit(
          "data",
          "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n"
        );
      socket.on("command", (data: any) => {
        stream.write(data.data);
      });
      stream.on("data", (d: any) => {
        socket.emit("stdout", d.toString("binary"));
      });
      stream.on("close", () => {
        conn.end();
      });
    });
  });

  // Handle command messages
  socket.on("command", (message: any) => {
    httpSocketServer.emit("command", message);
  });

  socket.on("disconnect", () => {
    conn.end();
    console.log("A user disconnected");
  });

  // question validation block

  socket.on("validate-exercise", async ({ labId, questionId }) => {
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
