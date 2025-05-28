import { ILabValidationHandler } from "../interfaces/ILabValidationHandler";
import { DO280ValidationHandler } from "./DO280ValidationHandler";
import { EX200ValidationHandler } from "./EX200ValidationHandler";
import { EX280ValidationHandler } from "./EX280ValidationHandler";

export class LabValidationHandlerFactory {
  private readonly handlers: Map<string, ILabValidationHandler>;

  constructor(
    ex200Handler: EX200ValidationHandler,
    ex280Handler: EX280ValidationHandler,
    do280Handler: DO280ValidationHandler
  ) {
    this.handlers = new Map<string, ILabValidationHandler>([
      ["ex200", ex200Handler],
      ["ex280", ex280Handler],
      ["do280", do280Handler],
    ]);
  }

  getHandler(labId: string): ILabValidationHandler | undefined {
    return this.handlers.get(labId);
  }
}
