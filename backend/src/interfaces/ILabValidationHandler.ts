import { Socket } from 'socket.io';

export interface ILabValidationHandler {
  handleValidation(
    socket: Socket,
    questionId: string,
    labId: string,
    validationQuestionId: string
  ): Promise<void>;
}
