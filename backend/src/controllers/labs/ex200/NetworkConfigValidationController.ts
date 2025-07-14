import { NetworkConfigValidationService } from "../../../services/ex200/NetworkConfigValidationService";
import { Socket } from "socket.io";


export class NetworkConfigValidationController {
  private service: NetworkConfigValidationService;

  constructor() {
    this.service = new NetworkConfigValidationService();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "IP Address",
      status: "loading",
    });
    const isCorrectIP = await this.service.validateIPAddress();
    socket.emit(`validation-${questionId}-step`, {
      step: "IP Address",
      status: isCorrectIP ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Hostname",
      status: "loading",
    });
    const isCorrectHostname = await this.service.validateHostname();
    socket.emit(`validation-${questionId}-step`, {
      step: "Hostname",
      status: isCorrectHostname ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Netmask [24]",
      status: "loading",
    });
    const isValidNetMask = await this.service.validateNetmask();
    socket.emit(`validation-${questionId}-step`, {
      step: "Netmask [24]",
      status: isValidNetMask ? "success" : "failed",
    });

    //
    socket.emit(`validation-${questionId}-step`, {
      step: "Gateway",
      status: "loading",
    });
    const isValidGateway = await this.service.validateGateway();
    socket.emit(`validation-${questionId}-step`, {
      step: "Gateway",
      status: isValidGateway ? "success" : "failed",
    });

    //
    socket.emit(`validation-${questionId}-step`, {
      step: "DNS",
      status: "loading",
    });
    const isCorrectDNS = await this.service.validateDNS();
    socket.emit(`validation-${questionId}-step`, {
      step: "DNS",
      status: isCorrectDNS ? "success" : "failed",
    });

    const validateNetworkConfig = await this.service.validateNetworkConfig();
    socket.emit("Validating Network Configuration", validateNetworkConfig);
  };
}
