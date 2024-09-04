import { ValidationService } from "../services/validationService";
import { Socket } from "socket.io";

export class ValidationController {
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ValidationService();
  }

  handleValidation = async (socket: Socket, username: string) => {
    socket.emit("validation-step", {
      step: "file-existence",
      status: "loading",
    });
    const fileExists = await this.validationService.validateFileExistence(
      username
    );
    socket.emit("validation-step", {
      step: "file-existence",
      status: fileExists ? "success" : "error",
    });

    socket.emit("validation-step", { step: "file-content", status: "loading" });
    const contentValid = await this.validationService.validateFileContent(
      username
    );
    socket.emit("validation-step", {
      step: "file-content",
      status: contentValid ? "success" : "error",
    });

    const result = await this.validationService.validateChallenge(username);
    socket.emit("validation-complete", result);
  };
}
