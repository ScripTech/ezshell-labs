"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const ssh_service_1 = require("../utils/ssh-service");
class ValidationService {
    async validateFileExistence(username) {
        if (!ssh_service_1.ssh.isConnected()) {
            await (0, ssh_service_1.connectSSH)();
        }
        return (0, ssh_service_1.validateFileExistence)(username);
    }
    async validateFileContent(username) {
        if (!ssh_service_1.ssh.isConnected()) {
            await (0, ssh_service_1.connectSSH)();
        }
        return (0, ssh_service_1.validateFileContent)(username);
    }
    async validateChallenge(username) {
        const fileExists = await this.validateFileExistence(username);
        const contentValid = await this.validateFileContent(username);
        if (fileExists && contentValid) {
            return { success: true, message: "Challenge completed successfully!" };
        }
        else {
            return { success: false, message: "Challenge failed." };
        }
    }
}
exports.ValidationService = ValidationService;
