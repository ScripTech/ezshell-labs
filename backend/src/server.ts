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

dotenv.config();

const cors = require("cors");
const app = express();
const port = Number.parseInt(process.env.SERVER_PORT!) ?? 3001;

const httpSocketServer = new Server({
  cors: {
    origin: "*",
  },
});

const validationController = new ValidationController();
const networkConfigValidationController =
  new NetworkConfigValidationController();
const userGroupMnt = new UserGroupManagementController();
const yumManagement = new YumRepositoryValidationController();
const selinuxMnt = new SELinuxManagementController();
const collabDirV1 = new CollaborativeDirectoryControllerV1();
const cronJob = new CronJobController();
const autofsConfig = new AutofsConfigurationController();
const basicController = new BasicValidationController();

httpSocketServer.on("connection", (socket) => {
  console.log("Client connected");

  const conn = new ssh2.Client();
  conn.connect({
    host: process.env.LAB_SSH_HOST,
    port: Number.parseInt(process.env.LAB_SSH_PORT!) ?? 22,
    username: process.env.LAB_SSH_USERNAME ?? "lab-user",
    password: process.env.LAB_SSH_PASSWORD ?? "password",
  });

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

  socket.on("validate-exercise", async (id) => {
    switch (id) {
      case "question-1-network-config":
        networkConfigValidationController.handleValidation(socket, id);
        break;
      case "question-2-yum-repository":
        yumManagement.handleValidation(socket, id);
        break;
      case "question-14-configure-yum-repository":
        yumManagement.handleValidation(socket, id);
        break;
      case "question-3-selinux-port":
        selinuxMnt.handleValidation(socket, id);
        break;
      case "question-4-user-group-management":
        userGroupMnt.handleValidations(socket, id, {
          group: "sysadm",
          users: ["natasha"],
        });
        break;
      case "question-5-collaborative-directory":
        collabDirV1.handleValidation(socket, id);
        break;
      case "question-6-cron-job":
        cronJob.handleValidation(socket, id, {
          user: "natasha",
          cronjob: '*/1\t*\t*\t*\t*\tlogger "EX200 Testing"',
        });
        break;
      case "question-7-autofs-configuration":
        autofsConfig.handleValidation(socket, id);
        break;
      case "question-8-create-tar-archive":
        basicController.handleTarValidation(socket, id);
        break;
      case "question-9-file-permissions":
        basicController.handleFilePermissionsValidation(socket, id);
        break;
      case "question-10-time-synchronization":
        basicController.handleTimeSynchronizationValidation(socket, id);
        break;
      case "question-11-find-user-files":
        break;
      case "question-12-string-search":
        basicController.handleStringSearchValidation(socket, id);
        break;
      case "question-13-create-user":
        userGroupMnt.handleUserIDValidation(socket, id, {
          user: "appservice",
          id: "2334",
        });
        break;
      case "question-18-configure-tuned-profile":
        basicController.handleTunedProfileValidation(socket, id);
        break;
      default:
        break;
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
    console.log(
      `WebSocket validation API listening at http://localhost:${port}`
    );
  })
);
