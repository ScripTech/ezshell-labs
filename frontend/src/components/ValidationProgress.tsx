'use client';

import React, { useState, useEffect } from 'react';
import { enhancedLabService, ValidationStepProgress } from '../services/EnhancedLabService';

export interface ValidationProgressProps {
  taskId: string;
  userId: string;
  attemptId: string;
  validationData: any;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface ValidationState {
  isValidating: boolean;
  totalSteps: number;
  currentStep: number;
  steps: ValidationStepProgress[];
  finalResult: any;
  error: string | null;
}

export const ValidationProgress: React.FC<ValidationProgressProps> = ({
  taskId,
  userId,
  attemptId,
  validationData,
  onComplete,
  onError,
  className = '',
}) => {
  const [state, setState] = useState<ValidationState>({
    isValidating: false,
    totalSteps: 0,
    currentStep: 0,
    steps: [],
    finalResult: null,
    error: null,
  });

  useEffect(() => {
    // Set up validation event listeners
    const handleValidationStart = (data: { totalSteps: number; steps: any[] }) => {
      setState(prev => ({
        ...prev,
        isValidating: true,
        totalSteps: data.totalSteps,
        steps: data.steps.map(step => ({
          stepId: step.id,
          stepName: step.name,
          status: 'pending',
          progress: 0,
          totalSteps: data.totalSteps,
        })),
        error: null,
      }));
    };

    const handleStepProgress = (data: ValidationStepProgress) => {
      setState(prev => ({
        ...prev,
        currentStep: data.progress,
        steps: prev.steps.map(step =>
          step.stepId === data.stepId
            ? { ...step, ...data }
            : step
        ),
      }));
    };

    const handleStepComplete = (data: ValidationStepProgress) => {
      setState(prev => ({
        ...prev,
        currentStep: data.progress,
        steps: prev.steps.map(step =>
          step.stepId === data.stepId
            ? { ...step, ...data }
            : step
        ),
      }));
    };

    const handleValidationComplete = (data: any) => {
      setState(prev => ({
        ...prev,
        isValidating: false,
        finalResult: data,
      }));
      onComplete?.(data);
    };

    const handleValidationError = (error: any) => {
      const errorMessage = error.message || error.error || 'Validation failed';
      setState(prev => ({
        ...prev,
        isValidating: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    };

    // Add event listeners
    enhancedLabService.on('validation-enhanced-start', handleValidationStart);
    enhancedLabService.on('validation-step-progress', handleStepProgress);
    enhancedLabService.on('validation-step-complete', handleStepComplete);
    enhancedLabService.on('validation-enhanced-complete', handleValidationComplete);
    enhancedLabService.on('validation-error', handleValidationError);

    // Cleanup listeners on unmount
    return () => {
      enhancedLabService.off('validation-enhanced-start', handleValidationStart);
      enhancedLabService.off('validation-step-progress', handleStepProgress);
      enhancedLabService.off('validation-step-complete', handleStepComplete);
      enhancedLabService.off('validation-enhanced-complete', handleValidationComplete);
      enhancedLabService.off('validation-error', handleValidationError);
    };
  }, [onComplete, onError]);

  const startValidation = async () => {
    try {
      setState(prev => ({ ...prev, error: null, finalResult: null }));
      await enhancedLabService.validateTaskEnhanced(taskId, attemptId, validationData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start validation';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-gray-300"></div>
          </div>
        );
      case 'running':
        return (
          <div className="h-8 w-8 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        );
      case 'success':
        return (
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-gray-300"></div>
          </div>
        );
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const progressPercentage = state.totalSteps > 0 ? (state.currentStep / state.totalSteps) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Task Validation</h3>
          {!state.isValidating && state.steps.length === 0 && !state.finalResult && (
            <button
              onClick={startValidation}
              disabled={state.isValidating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Validation
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Progress Bar */}
        {(state.isValidating || state.steps.length > 0) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {state.isValidating ? 'Validating...' : 'Validation Complete'}
              </span>
              <span className="text-sm text-gray-500">
                {state.currentStep}/{state.totalSteps} steps
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  state.error ? 'bg-red-500' : state.finalResult ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                <p className="text-sm text-red-700 mt-1">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Final Result */}
        {state.finalResult && (
          <div className={`mb-6 rounded-lg p-4 ${
            state.finalResult.status === 'completed'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {state.finalResult.status === 'completed' ? (
                  <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  state.finalResult.status === 'completed' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {state.finalResult.message}
                </h3>
                <p className={`text-sm mt-1 ${
                  state.finalResult.status === 'completed' ? 'text-green-700' : 'text-red-700'
                }`}>
                  Score: {state.finalResult.finalScore}% |
                  Steps: {state.finalResult.completedSteps}/{state.finalResult.totalSteps}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Steps */}
        {state.steps.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Validation Steps</h4>
            {state.steps.map((step, index) => (
              <div
                key={step.stepId}
                className={`border rounded-lg p-4 transition-all duration-200 ${getStepColor(step.status)}`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-900">
                        {step.stepName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                      <span className="text-xs text-gray-500">
                        Step {index + 1} of {state.totalSteps}
                      </span>
                    </div>

                    {step.status === 'running' && (
                      <p className="text-sm text-blue-600 mt-1">Processing...</p>
                    )}

                    {step.status === 'success' && step.result && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Passed - Score: {step.result.score || 0}/{step.result.maxScore || 10}
                      </p>
                    )}

                    {step.status === 'failed' && (
                      <p className="text-sm text-red-600 mt-1">
                        ✗ Failed{step.error ? ` - ${step.error}` : ''}
                      </p>
                    )}

                    {step.currentScore !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Current Score</span>
                          <span>{step.currentScore}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Initial State */}
        {!state.isValidating && state.steps.length === 0 && !state.finalResult && !state.error && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to Validate</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click the "Start Validation" button to begin step-by-step task validation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
