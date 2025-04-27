export interface IValidationStep {
  step: string;
  status: 'loading' | 'success' | 'failed';
}

export interface IValidationResult {
  success: boolean;
  message?: string;
  details?: any;
}

export interface IValidationService {
  validate(): Promise<IValidationResult>;
  getSteps(): string[];
}
