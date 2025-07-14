import { Socket } from "socket.io";
import { YumRepositoryValidationService } from "../../../services/ex200/YumRepositoryValidationService";



export class YumRepositoryValidationController {
  private service: YumRepositoryValidationService;

  constructor() {
    this.service = new YumRepositoryValidationService();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "BaseOS Repository",
      status: "loading",
    });
    const baseOs = await this.service.validateBaseOSRepo();
    socket.emit(`validation-${questionId}-step`, {
      step: "BaseOS Repository",
      status: baseOs ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "App Stream Repository",
      status: "loading",
    });
    const appStream = await this.service.validateAppStreamRepo();
    socket.emit(`validation-${questionId}-step`, {
      step: "App Stream Repository",
      status: appStream ? "success" : "failed",
    });


    socket.emit(`validation-${questionId}-step`, {
      step: "Repository URL",
      status: "loading",
    });
    const validateUrl = await this.service.validateRepoURLs();
    socket.emit(`validation-${questionId}-step`, {
      step: "Repository URL",
      status: validateUrl ? "success" : "failed",
    });
  };
}
