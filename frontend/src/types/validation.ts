export interface ValidationStep {
  lab: string;
  step: string;
  status: 'loading' | 'success' | 'failed';
}
