export interface ValidationStep {
  id: string;
  type: string;
  method: string;
  params: Record<string, any>;
  description?: string;
  weight?: number; // For scoring
}

export interface ValidationConfig {
  steps: ValidationStep[];
  totalPoints: number;
  passingScore?: number;
}

export interface ValidationResult {
  stepId: string;
  success: boolean;
  score: number;
  maxScore: number;
  message: string;
  details?: any;
  executionTime?: number;
}

export interface ValidationSummary {
  taskId: string;
  userId: string;
  totalScore: number;
  maxScore: number;
  passed: boolean;
  completedSteps: number;
  totalSteps: number;
  results: ValidationResult[];
  executedAt: Date;
}

export interface ValidationExecutor {
  executeStep(step: ValidationStep, context: ValidationContext): Promise<ValidationResult>;
  getSupportedTypes(): string[];
}

export interface ValidationContext {
  taskId: string;
  userId: string;
  labId: string;
  sessionData?: Record<string, any>;
  sshConfig?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
}
