"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const validationController_1 = require("./controllers/validationController");
const ssh2_1 = __importDefault(require("ssh2"));
const cors = require("cors");
const app = (0, express_1.default)();
const port = 3001;
const httpSocketServer = new socket_io_1.Server({
    cors: {
        origin: "*"
    }
});
const validationController = new validationController_1.ValidationController();
httpSocketServer.on("connection", (socket) => {
    console.log("Client connected");
    const conn = new ssh2_1.default.Client();
    conn.connect({
        host: "localhost",
        port: 2222,
        username: "lab-user",
        password: "password",
    });
    conn.on("ready", () => {
        console.log("SSH CONNECTION ESTABLISHED");
        socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
        conn.shell((err, stream) => {
            if (err)
                return socket.emit("data", "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n");
            socket.on("command", (data) => {
                stream.write(data.data);
            });
            stream.on("data", (d) => {
                socket.emit("stdout", d.toString("binary"));
            });
            stream.on("close", () => {
                conn.end();
            });
        });
    });
    // Handle command messages
    socket.on("command", (message) => {
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
httpSocketServer.listen(app.listen(port, () => {
    console.log(`WebSocket validation API listening at http://localhost:${port}`);
}));
