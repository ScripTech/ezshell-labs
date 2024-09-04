import express from "express";
import { Server } from "socket.io";
import { ValidationController } from "./controllers/validationController";
import ssh2 from 'ssh2';

const cors = require("cors");
const app = express();
const port = process.env.SERVER_PORT || 3001;

const httpSocketServer = new Server({
  cors: {
    origin: "*"
  }
});

const validationController = new ValidationController();

httpSocketServer.on("connection", (socket) => {
  console.log("Client connected");

  const conn = new ssh2.Client();
  conn.connect({
    host: process.env.LAB_SSH_HOST,
    port: 2222,
    username: process.env.LAB_SSH_USERNAME,
    password: "password",
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
