import { Socket } from 'socket.io';
import { IValidationService, IValidationStep } from '../../interfaces/IValidationService';

export abstract class BaseLabController {
  protected constructor(protected readonly service: IValidationService) {}

  protected async emitValidationStep(
    socket: Socket,
    questionId: string,
    step: string,
    status: 'loading' | 'success' | 'failed'
  ) {
    socket.emit(`validation-${questionId}-step`, {
      step,
      status,
    } as IValidationStep);
  }

  abstract handleValidation(socket: Socket, questionId: string, options?: any): Promise<void>;
}
