import express from "express";
import { Server } from "socket.io";
import { ValidationController } from "./controllers/validationController";
import ssh2 from "ssh2";
import dotenv from "dotenv";
import { NetworkConfigValidationController } from "./controllers/exercises/NetworkConfigValidationController";
import { UserGroupManagementController } from "./controllers/exercises/UserGroupManagementController";
import { YumRepositoryValidationController } from "./controllers/exercises/YumRepositoryValidationController";

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
      case "question-4-user-group-management":
        userGroupMnt.handleValidations(socket, id, {
          group: "sysadm",
          users: ["natasha"],
        });
        break;
      case "question-2-yum-repository":
        yumManagement.handleValidation(socket, id);
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
