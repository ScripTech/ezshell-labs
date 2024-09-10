import { Socket } from "socket.io";
import { SELinuxManagementService } from "../../services/SELinuxManagementService";

export class SELinuxManagementController {
  private service: SELinuxManagementService;

  constructor() {
    this.service = new SELinuxManagementService();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "httpd service active",
      status: "loading",
    });
    const isServiceUp = await this.service.validateService("httpd");
    socket.emit(`validation-${questionId}-step`, {
      step: "httpd service active",
      status: isServiceUp ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Semanage valid port",
      status: "loading",
    });
    const isPortAccessible = await this.service.validateSemanagePort(82);
    socket.emit(`validation-${questionId}-step`, {
      step: "Semanage valid port",
      status: isPortAccessible ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Curl Service to get status",
      status: "loading",
    });
    const curlService = await this.service.validateSemanagePort(82);
    socket.emit(`validation-${questionId}-step`, {
      step: "Curl Service to get status",
      status: curlService ? "success" : "failed",
    });
  };
}
