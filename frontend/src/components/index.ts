// Enhanced Lab Components
export { ProgressDashboard } from './ProgressDashboard';
export { ValidationProgress } from './ValidationProgress';
export { LabTaskProgress } from './LabTaskProgress';
export { EnhancedTerminal } from './EnhancedTerminal';
export { AdminDashboard } from './AdminDashboard';
export { LabWorkspace } from './LabWorkspace';

// Services
export { enhancedLabService } from '../services/EnhancedLabService';
export type {
  ProgressSession,
  TaskAttempt,
  LearningInsights,
  ValidationStepProgress,
} from '../services/EnhancedLabService';

// Component Props Types
export type { EnhancedTerminalProps } from './EnhancedTerminal';
export type { ValidationProgressProps } from './ValidationProgress';
export type { LabTaskProgressProps } from './LabTaskProgress';
