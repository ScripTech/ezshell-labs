"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationController = void 0;
const validationService_1 = require("../services/validationService");
class ValidationController {
    constructor() {
        this.handleValidation = async (socket, username) => {
            socket.emit("validation-step", {
                step: "file-existence",
                status: "loading",
            });
            const fileExists = await this.validationService.validateFileExistence(username);
            socket.emit("validation-step", {
                step: "file-existence",
                status: fileExists ? "success" : "error",
            });
            socket.emit("validation-step", { step: "file-content", status: "loading" });
            const contentValid = await this.validationService.validateFileContent(username);
            socket.emit("validation-step", {
                step: "file-content",
                status: contentValid ? "success" : "error",
            });
            const result = await this.validationService.validateChallenge(username);
            socket.emit("validation-complete", result);
        };
        this.validationService = new validationService_1.ValidationService();
    }
}
exports.ValidationController = ValidationController;
