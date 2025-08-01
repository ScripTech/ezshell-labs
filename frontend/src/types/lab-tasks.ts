export interface LabTask {
  id: string;
  labId: string;
  order: number;
  title: string;
  description?: string;
  difficulty?: string;
  points: number;
  hint?: string;
  validationSteps?: any;
  markdown?: string;
  isEnabled: boolean;
  status: TaskStatus;
  maintenanceMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'active' | 'maintenance' | 'deprecated' | 'review';

export interface TaskEditFormData {
  title: string;
  description?: string;
  difficulty?: string;
  points: number;
  hint?: string;
  markdown?: string;
  isEnabled: boolean;
  status: TaskStatus;
  maintenanceMessage?: string;
}

export interface TaskStatusUpdate {
  status: TaskStatus;
  isEnabled: boolean;
  maintenanceMessage?: string;
}

export const TASK_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
  { value: 'deprecated', label: 'Deprecated', color: 'red' },
  { value: 'review', label: 'Under Review', color: 'blue' },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
] as const;
