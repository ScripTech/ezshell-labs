import { Socket } from "socket.io";
import { CronJobService } from "../../../services/ex200/CronJobService";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class CronJobController {
  private service: CronJobService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new CronJobService();
    this.trackingService = new ValidationTrackingService();
  }

  // New socket tracking methods
  handleValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string, user: string, cronjob: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performCronJobValidation(trackedSocket, validationQuestionId, { user: data.user, cronjob: data.cronjob });
        }
      );
    } catch (error) {
      console.error("Error in cron job validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performCronJobValidation(socket: Socket, questionId: string, data: { user: string, cronjob: string }): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: `Runs daily every 1 minute`,
        status: "loading",
      });
      const isValidCrontime = await this.service.validateUserCronJob(data.user, data.cronjob);
      socket.emit(`validation-${questionId}-step`, {
        step: `Runs daily every 1 minute`,
        status: isValidCrontime ? "success" : "failed",
        message: isValidCrontime ? "Cron job has correct timing" : "Cron job timing is incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: `Executes Logger`,
        status: "loading",
      });
      const execLogger = await this.service.validateUserCronJob(data.user, data.cronjob);
      socket.emit(`validation-${questionId}-step`, {
        step: `Executes Logger`,
        status: execLogger ? "success" : "failed",
        message: execLogger ? "Cron job executes logger correctly" : "Cron job does not execute logger"
      });

      return isValidCrontime && execLogger;
    } catch (error) {
      console.error("Error in cron job validation:", error);
      const steps = ["Runs daily every 1 minute", "Executes Logger"];
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

  // Legacy method - maintain backward compatibility
  handleValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      user: string;
      cronjob: string;
    }
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `Runs daily every 1 minute`,
      status: "loading",
    });
    const isValidCrontime = await this.service.validateUserCronJob(
      data.user,
      data.cronjob
    );
    socket.emit(`validation-${questionId}-step`, {
      step: `Runs daily every 1 minute`,
      status: isValidCrontime ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: `Executes Logger`,
      status: "loading",
    });
    const execLogger = await this.service.validateUserCronJob(
      data.user,
      data.cronjob
    );
    socket.emit(`validation-${questionId}-step`, {
      step: `Executes Logger`,
      status: execLogger ? "success" : "failed",
    });
  };
}
