"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssh = void 0;
exports.connectSSH = connectSSH;
exports.validateFileExistence = validateFileExistence;
exports.validateFileContent = validateFileContent;
const node_ssh_1 = require("node-ssh");
exports.ssh = new node_ssh_1.NodeSSH();
async function connectSSH() {
    await exports.ssh.connect({
        // host: "challenge-environment",
        host: "openssh-server",
        port: 2222,
        username: "lab-user",
        password: "password",
        // privateKey: "/path/to/validator_key",
    });
}
async function validateFileExistence(username) {
    try {
        const result = await exports.ssh.execCommand(`test -f /home/${username}/filename`);
        return result.code === 0;
    }
    catch (error) {
        console.error("SSH execution error:", error);
        return false;
    }
}
async function validateFileContent(username) {
    try {
        const result = await exports.ssh.execCommand(`cat /home/${username}/filename`);
        return result.stdout.trim() === "hello world";
    }
    catch (error) {
        console.error("SSH execution error:", error);
        return false;
    }
}
