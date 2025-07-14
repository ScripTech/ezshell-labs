import { Socket } from "socket.io";
import { ValidationService } from "../../../services/ex200/validationService";

export class ValidationController {
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ValidationService();
  }

  handleValidation = async (socket: Socket, username: string) => {

    console.log("start handling exercise validation");

    socket.emit("validation-step", {
      step: "File Existence",
      status: "loading",
    });
    const fileExists = await this.validationService.validateFileExistence(
      username
    );
    socket.emit("validation-step", {
      step: "File Existence",
      status: fileExists ? "success" : "failed",
    });

    socket.emit("validation-step", { step: "File Content", status: "loading" });
    const contentValid = await this.validationService.validateFileContent(
      username
    );
    socket.emit("validation-step", {
      step: "File Content",
      status: contentValid ? "success" : "failed",
    });

    const result = await this.validationService.validateChallenge(username);
    socket.emit("validation-complete", result);
  };
}
