import { Socket } from 'socket.io';

export interface ILabValidationHandler {
  handleValidation(socket: Socket, questionId: string): Promise<void>;
}
