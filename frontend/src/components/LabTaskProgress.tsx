'use client';

import React, { useState, useEffect } from 'react';
import { enhancedLabService, TaskAttempt, ProgressSession } from '../services/EnhancedLabService';

interface LabTaskProgressProps {
  labId: string;
  userId: string;
  className?: string;
  onTaskComplete?: (taskId: string, result: any) => void;
  onLabComplete?: (labResult: any) => void;
}

export type { LabTaskProgressProps };

interface TaskProgress {
  taskId: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  score: number;
  maxScore: number;
  attempts: number;
  maxAttempts: number;
  estimatedTime: number;
  actualTime: number;
  hints: string[];
  isOptional: boolean;
  dependencies: string[];
}

interface LabProgress {
  labId: string;
  title: string;
  description: string;
  totalTasks: number;
  completedTasks: number;
  totalScore: number;
  maxScore: number;
  startedAt: Date;
  estimatedDuration: number;
  actualDuration: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  tasks: TaskProgress[];
}

export const LabTaskProgress: React.FC<LabTaskProgressProps> = ({
  labId,
  userId,
  className = '',
  onTaskComplete,
  onLabComplete,
}) => {
  const [labProgress, setLabProgress] = useState<LabProgress | null>(null);
  const [currentSession, setCurrentSession] = useState<ProgressSession | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<TaskAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    // Set up event listeners
    const handleProgressUpdate = (session: ProgressSession) => {
      setCurrentSession(session);
      updateLabProgressFromSession(session);
    };

    const handleTaskStart = (attempt: TaskAttempt) => {
      setCurrentAttempt(attempt);
      setLabProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(task =>
            task.taskId === attempt.taskId
              ? { ...task, status: 'active' as const }
              : task
          ),
        };
      });
    };

    const handleTaskComplete = (result: any) => {
      setLabProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(task =>
            task.taskId === result.taskId
              ? {
                  ...task,
                  status: result.status === 'completed' ? 'completed' : 'failed',
                  score: result.score || 0,
                  attempts: (result.attempts || 0) + 1,
                  actualTime: result.duration || 0,
                }
              : task
          ),
          completedTasks: prev.tasks.filter(t =>
            t.taskId === result.taskId ? result.status === 'completed' : t.status === 'completed'
          ).length + (result.status === 'completed' ? 1 : 0),
          totalScore: prev.tasks.reduce((total, t) => {
            if (t.taskId === result.taskId) {
              return total + (result.score || 0);
            }
            return total + t.score;
          }, 0),
        };
      });
      onTaskComplete?.(result.taskId, result);
    };

    const handleLabComplete = (result: any) => {
      setLabProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: result.status === 'completed' ? 'completed' : 'failed',
          actualDuration: result.duration || 0,
        };
      });
      onLabComplete?.(result);
    };

    const handleError = (error: any) => {
      setError(error.message || 'An error occurred');
    };

    // Add event listeners
    enhancedLabService.on('progress-update', handleProgressUpdate);
    enhancedLabService.on('task-started', handleTaskStart);
    enhancedLabService.on('task-completed', handleTaskComplete);
    enhancedLabService.on('lab-completed', handleLabComplete);
    enhancedLabService.on('error', handleError);

    // Load initial lab progress
    loadLabProgress();

    return () => {
      enhancedLabService.off('progress-update', handleProgressUpdate);
      enhancedLabService.off('task-started', handleTaskStart);
      enhancedLabService.off('task-completed', handleTaskComplete);
      enhancedLabService.off('lab-completed', handleLabComplete);
      enhancedLabService.off('error', handleError);
    };
  }, [labId, userId, onTaskComplete, onLabComplete]);

  const loadLabProgress = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate loading lab progress (this would come from the backend)
      setTimeout(() => {
        setLabProgress({
          labId,
          title: 'Red Hat Enterprise Linux Administration',
          description: 'Learn essential RHEL administration skills',
          totalTasks: 8,
          completedTasks: 3,
          totalScore: 245,
          maxScore: 400,
          startedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
          estimatedDuration: 120, // 2 hours
          actualDuration: 45,
          status: 'in-progress',
          tasks: [
            {
              taskId: 'task-1',
              title: 'User Management',
              description: 'Create and manage user accounts',
              status: 'completed',
              score: 45,
              maxScore: 50,
              attempts: 1,
              maxAttempts: 3,
              estimatedTime: 15,
              actualTime: 12,
              hints: ['Use useradd command', 'Remember to set passwords'],
              isOptional: false,
              dependencies: [],
            },
            {
              taskId: 'task-2',
              title: 'File Permissions',
              description: 'Configure file and directory permissions',
              status: 'completed',
              score: 48,
              maxScore: 50,
              attempts: 2,
              maxAttempts: 3,
              estimatedTime: 20,
              actualTime: 18,
              hints: ['Use chmod and chown commands', 'Check octal notation'],
              isOptional: false,
              dependencies: ['task-1'],
            },
            {
              taskId: 'task-3',
              title: 'Service Management',
              description: 'Start, stop, and configure system services',
              status: 'completed',
              score: 42,
              maxScore: 50,
              attempts: 1,
              maxAttempts: 3,
              estimatedTime: 25,
              actualTime: 15,
              hints: ['Use systemctl command', 'Enable services for boot'],
              isOptional: false,
              dependencies: ['task-1'],
            },
            {
              taskId: 'task-4',
              title: 'Network Configuration',
              description: 'Configure network interfaces and routing',
              status: 'active',
              score: 0,
              maxScore: 50,
              attempts: 1,
              maxAttempts: 3,
              estimatedTime: 30,
              actualTime: 0,
              hints: ['Use nmcli or network scripts', 'Check connectivity'],
              isOptional: false,
              dependencies: ['task-2'],
            },
            {
              taskId: 'task-5',
              title: 'Package Management',
              description: 'Install and manage software packages',
              status: 'pending',
              score: 0,
              maxScore: 50,
              attempts: 0,
              maxAttempts: 3,
              estimatedTime: 20,
              actualTime: 0,
              hints: ['Use yum or dnf commands', 'Manage repositories'],
              isOptional: false,
              dependencies: ['task-3'],
            },
            {
              taskId: 'task-6',
              title: 'Log Analysis',
              description: 'Analyze system logs and troubleshoot issues',
              status: 'pending',
              score: 0,
              maxScore: 50,
              attempts: 0,
              maxAttempts: 3,
              estimatedTime: 25,
              actualTime: 0,
              hints: ['Use journalctl and log files', 'Filter by service or time'],
              isOptional: false,
              dependencies: ['task-4'],
            },
            {
              taskId: 'task-7',
              title: 'Backup and Recovery',
              description: 'Create and restore system backups',
              status: 'pending',
              score: 0,
              maxScore: 50,
              attempts: 0,
              maxAttempts: 3,
              estimatedTime: 30,
              actualTime: 0,
              hints: ['Use tar and rsync', 'Test restore procedures'],
              isOptional: true,
              dependencies: ['task-5'],
            },
            {
              taskId: 'task-8',
              title: 'Security Hardening',
              description: 'Implement basic security measures',
              status: 'pending',
              score: 0,
              maxScore: 50,
              attempts: 0,
              maxAttempts: 3,
              estimatedTime: 35,
              actualTime: 0,
              hints: ['Configure firewall', 'Set up SSH keys', 'Review audit logs'],
              isOptional: false,
              dependencies: ['task-6'],
            },
          ],
        });
        setIsLoading(false);
      }, 1000);

    } catch (error: any) {
      setError(error.message || 'Failed to load lab progress');
      setIsLoading(false);
    }
  };

  const updateLabProgressFromSession = (session: ProgressSession) => {
    // Update lab progress based on session data
    setLabProgress(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actualDuration: Math.floor((Date.now() - session.startedAt.getTime()) / 60000),
      };
    });
  };

  const getTaskStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'active':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'failed':
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getTaskIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'completed':
        return (
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'active':
        return (
          <svg className="h-5 w-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-gray-400 bg-white"></div>
        );
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const progressPercentage = labProgress ? (labProgress.completedTasks / labProgress.totalTasks) * 100 : 0;
  const scorePercentage = labProgress ? (labProgress.totalScore / labProgress.maxScore) * 100 : 0;

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Lab Progress</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadLabProgress}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!labProgress) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Lab Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{labProgress.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{labProgress.description}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              labProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
              labProgress.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
              labProgress.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {labProgress.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Tasks Progress</p>
            <div className="flex items-center mt-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {labProgress.completedTasks}/{labProgress.totalTasks}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Score</p>
            <div className="flex items-center mt-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scorePercentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {labProgress.totalScore}/{labProgress.maxScore}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Time Spent</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDuration(labProgress.actualDuration)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Estimated</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDuration(labProgress.estimatedDuration)}
            </p>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks</h3>
        <div className="space-y-3">
          {labProgress.tasks.map((task, index) => (
            <div key={task.taskId} className={`border-l-4 rounded-lg p-4 ${getTaskStatusColor(task.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 mr-3">
                    {getTaskIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Score: {task.score}/{task.maxScore}</span>
                        <span>Attempts: {task.attempts}/{task.maxAttempts}</span>
                        {task.isOptional && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                            Optional
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>

                    {task.status === 'active' && (
                      <div className="mt-2 text-sm text-blue-600">
                        ⏱️ Currently working on this task...
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setExpandedTask(expandedTask === task.taskId ? null : task.taskId)}
                  className="ml-4 p-1 hover:bg-gray-200 rounded"
                >
                  <svg
                    className={`h-5 w-5 text-gray-400 transform transition-transform ${
                      expandedTask === task.taskId ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Expanded Details */}
              {expandedTask === task.taskId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Progress Details</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Estimated Time: {formatDuration(task.estimatedTime)}</div>
                        {task.actualTime > 0 && (
                          <div>Actual Time: {formatDuration(task.actualTime)}</div>
                        )}
                        {task.dependencies.length > 0 && (
                          <div>Dependencies: {task.dependencies.join(', ')}</div>
                        )}
                      </div>
                    </div>

                    {task.hints.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Hints</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {task.hints.map((hint, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-blue-500 mr-2">💡</span>
                              {hint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
