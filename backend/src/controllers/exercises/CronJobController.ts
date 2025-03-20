import { Socket } from "socket.io";
import { CronJobService } from "../../services/CronJobService";

export class CronJobController {
  private service: CronJobService;

  constructor() {
    this.service = new CronJobService();
  }

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
