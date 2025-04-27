import { Socket } from 'socket.io';
import { BaseLabController } from '../BaseLabController';
import { OCPDeploymentValidationService } from '../../../services/ex280/OCPDeploymentValidationService';

export class EX280OCPDeploymentController extends BaseLabController {
  constructor() {
    super(new OCPDeploymentValidationService());
  }

  async handleValidation(socket: Socket, questionId: string): Promise<void> {
    const steps = this.service.getSteps();

    for (const step of steps) {
      await this.emitValidationStep(socket, questionId, step, 'loading');
      const result = await this.service.validate();
      await this.emitValidationStep(
        socket,
        questionId,
        step,
        result.success ? 'success' : 'failed'
      );
    }
  }
}
