import { NetworkConfigValidationService } from "../../../services/ex200/NetworkConfigValidationService";
import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";
import { ScoringUtils } from "../../../utils/ScoringUtils";

export class NetworkConfigValidationController {
  private service: NetworkConfigValidationService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new NetworkConfigValidationService();
    this.trackingService = new ValidationTrackingService();
  }

  handleValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Create enhanced scoring context - INTERMEDIATE preset for network configuration
      const context = ScoringUtils.createScoringContext(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        'INTERMEDIATE', // 15 points, 10% penalty per attempt
        {
          penaltyPerAttempt: 12.5, // Higher penalty for network configuration
        }
      );

      // Use the new socket tracking validation method with enhanced scoring
      await this.trackingService.executeValidationWithSocketTracking(
        context,
        async (trackedSocket: Socket) => {
          return await this.performNetworkConfigValidation(trackedSocket, validationQuestionId, userId, labId);
        }
      );

    } catch (error) {
      console.error("Error in network config validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performNetworkConfigValidation(socket: Socket, questionId: string, userId: string, labId: string): Promise<boolean> {
    try {
      // Initialize the service with user and lab context
      console.log(`🔧 Initializing network validation for user ${userId}, lab ${labId}`);
      const connected = await this.service.initialize(userId, labId);

      socket.emit(`validation-${questionId}-step`, {
        step: "IP Address",
        status: "loading",
      });
      const isCorrectIP = await this.service.validateIPAddress();
      socket.emit(`validation-${questionId}-step`, {
        step: "IP Address",
        status: isCorrectIP ? "success" : "failed",
        message: isCorrectIP ? "IP address is correctly configured" : "IP address configuration is incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Hostname",
        status: "loading",
      });
      const isCorrectHostname = await this.service.validateHostname();
      socket.emit(`validation-${questionId}-step`, {
        step: "Hostname",
        status: isCorrectHostname ? "success" : "failed",
        message: isCorrectHostname ? "Hostname is correctly configured" : "Hostname configuration is incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Netmask [24]",
        status: "loading",
      });
      const isValidNetMask = await this.service.validateNetmask();
      socket.emit(`validation-${questionId}-step`, {
        step: "Netmask [24]",
        status: isValidNetMask ? "success" : "failed",
        message: isValidNetMask ? "Netmask is correctly configured" : "Netmask configuration is incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Gateway",
        status: "loading",
      });
      const isValidGateway = await this.service.validateGateway();
      socket.emit(`validation-${questionId}-step`, {
        step: "Gateway",
        status: isValidGateway ? "success" : "failed",
        message: isValidGateway ? "Gateway is correctly configured" : "Gateway configuration is incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "DNS",
        status: "loading",
      });
      const isCorrectDNS = await this.service.validateDNS();
      socket.emit(`validation-${questionId}-step`, {
        step: "DNS",
        status: isCorrectDNS ? "success" : "failed",
        message: isCorrectDNS ? "DNS is correctly configured" : "DNS configuration is incorrect"
      });

      // Return overall success
      return isCorrectIP && isCorrectHostname && isValidNetMask && isValidGateway && isCorrectDNS;

    } catch (error) {
      console.error("Error in network config validation:", error);

      // Emit error for all pending steps
      const steps = ["IP Address", "Hostname", "Netmask [24]", "Gateway", "DNS"];
      steps.forEach(step => {
        socket.emit(`validation-${questionId}-step`, {
          step,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      });

      return false;
    }
  }
}
