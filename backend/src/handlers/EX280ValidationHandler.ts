import { Socket } from 'socket.io';
import { ILabValidationHandler } from '../interfaces/ILabValidationHandler';
import { EX280OCPDeploymentController } from '../controllers/labs/ex280/EX280OCPDeploymentController';

export class EX280ValidationHandler implements ILabValidationHandler {
  constructor(
    private ex280DeploymentController: EX280OCPDeploymentController,
  ) {}

  async handleValidation(socket: Socket, questionId: string): Promise<void> {
    switch (questionId) {
      case "01_manage_authentication":
        await this.ex280DeploymentController.handleValidation(socket, questionId);
        break;
      // ...other EX280 questions
      default:
        console.log(`Unknown EX280 question: ${questionId}`);
        break;
    }
  }
}
