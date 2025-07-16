'use client';

import React, { useState, useEffect } from 'react';
import { enhancedLabService } from '../services/EnhancedLabService';
import { ProgressDashboard } from './ProgressDashboard';
import { ValidationProgress } from './ValidationProgress';
import { LabTaskProgress } from './LabTaskProgress';
import { EnhancedTerminal } from './EnhancedTerminal';

interface LabWorkspaceProps {
  labId: string;
  userId: string;
  className?: string;
}

interface Lab {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  tags: string[];
  prerequisites: string[];
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  validationCriteria: string[];
  hints: string[];
  estimatedTime: number;
  maxAttempts: number;
  isOptional: boolean;
  order: number;
}

export const LabWorkspace: React.FC<LabWorkspaceProps> = ({
  labId,
  userId,
  className = '',
}) => {
  const [lab, setLab] = useState<Lab | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'terminal' | 'progress' | 'validation' | 'dashboard'>('terminal');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [validationData, setValidationData] = useState<any>(null);

  useEffect(() => {
    initializeWorkspace();
    setupEventListeners();

    return () => {
      cleanupEventListeners();
    };
  }, [labId, userId]);

  const initializeWorkspace = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Connect to the enhanced lab service
      if (!enhancedLabService.isConnected) {
        await enhancedLabService.authenticate(userId);
      }

      // Load lab data
      await loadLabData();

      // Start lab session
      await startLabSession();

    } catch (error: any) {
      setError(error.message || 'Failed to initialize workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLabData = async () => {
    // Simulate loading lab data (this would come from the backend)
    const mockLab: Lab = {
      id: labId,
      title: 'Red Hat Enterprise Linux Administration',
      description: 'Learn essential RHEL administration skills including user management, file permissions, services, and network configuration.',
      difficulty: 'intermediate',
      estimatedDuration: 120, // 2 hours
      tags: ['linux', 'rhel', 'administration', 'certification'],
      prerequisites: ['Basic Linux knowledge', 'Command line familiarity'],
      tasks: [
        {
          id: 'task-1',
          title: 'User Management',
          description: 'Create and manage user accounts with proper permissions',
          instructions: `
## Task Instructions

1. Create a new user account named 'labuser'
2. Set the user's home directory to /home/labuser
3. Add the user to the 'wheel' group for sudo access
4. Set a password for the user
5. Verify the user can log in and has sudo privileges

## Commands to Use
- \`useradd\` - Create user account
- \`usermod\` - Modify user account
- \`passwd\` - Set user password
- \`su\` - Switch user
- \`sudo\` - Execute commands as root
          `,
          validationCriteria: [
            'User account "labuser" exists',
            'User home directory is /home/labuser',
            'User is member of wheel group',
            'User can authenticate with password',
            'User has sudo privileges'
          ],
          hints: [
            'Use useradd -m to create home directory automatically',
            'Use usermod -aG wheel labuser to add to wheel group',
            'Remember to set a strong password',
            'Test sudo access with: sudo whoami'
          ],
          estimatedTime: 15,
          maxAttempts: 3,
          isOptional: false,
          order: 1,
        },
        {
          id: 'task-2',
          title: 'File Permissions',
          description: 'Configure file and directory permissions using chmod and chown',
          instructions: `
## Task Instructions

1. Create a directory /shared/data
2. Set ownership to labuser:labuser
3. Set permissions to 755 (rwxr-xr-x)
4. Create a file /shared/data/config.txt
5. Set file permissions to 644 (rw-r--r--)

## Commands to Use
- \`mkdir\` - Create directories
- \`chown\` - Change ownership
- \`chmod\` - Change permissions
- \`ls -l\` - List with permissions
          `,
          validationCriteria: [
            'Directory /shared/data exists',
            'Directory owned by labuser:labuser',
            'Directory has 755 permissions',
            'File /shared/data/config.txt exists',
            'File has 644 permissions'
          ],
          hints: [
            'Use mkdir -p to create parent directories',
            'Octal notation: 755 = rwxr-xr-x',
            'Use ls -l to verify permissions',
            'Remember to use sudo if needed'
          ],
          estimatedTime: 20,
          maxAttempts: 3,
          isOptional: false,
          order: 2,
        },
        {
          id: 'task-3',
          title: 'Service Management',
          description: 'Start, stop, and configure system services using systemctl',
          instructions: `
## Task Instructions

1. Check the status of the httpd service
2. Start the httpd service
3. Enable httpd to start at boot
4. Verify the service is running
5. Check which port httpd is listening on

## Commands to Use
- \`systemctl status\` - Check service status
- \`systemctl start\` - Start service
- \`systemctl enable\` - Enable service at boot
- \`systemctl is-active\` - Check if service is running
- \`netstat\` or \`ss\` - Check listening ports
          `,
          validationCriteria: [
            'httpd service is installed',
            'httpd service is running',
            'httpd service is enabled for boot',
            'httpd is listening on port 80',
            'Service status shows active (running)'
          ],
          hints: [
            'Install httpd if not present: yum install httpd',
            'Use systemctl enable --now to start and enable',
            'Check with: systemctl is-active httpd',
            'Use ss -tlnp | grep :80 to check port'
          ],
          estimatedTime: 25,
          maxAttempts: 3,
          isOptional: false,
          order: 3,
        },
      ],
    };

    setLab(mockLab);
    if (mockLab.tasks.length > 0) {
      setCurrentTask(mockLab.tasks[0]);
    }
  };

  const startLabSession = async () => {
    try {
      const session = await enhancedLabService.startProgress(labId, userId);
      setSessionId(session.sessionId);
    } catch (error) {
      console.error('Failed to start lab session:', error);
    }
  };

  const setupEventListeners = () => {
    const handleConnected = () => {
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleTaskStarted = (data: any) => {
      setAttemptId(data.attemptId);
      const task = lab?.tasks.find(t => t.id === data.taskId);
      if (task) {
        setCurrentTask(task);
      }
    };

    const handleTaskCompleted = (data: any) => {
      // Move to next task if current task is completed
      if (data.status === 'completed' && lab) {
        const currentIndex = lab.tasks.findIndex(t => t.id === data.taskId);
        if (currentIndex >= 0 && currentIndex < lab.tasks.length - 1) {
          setCurrentTask(lab.tasks[currentIndex + 1]);
        }
      }
    };

    const handleValidationComplete = (data: any) => {
      setValidationData(data);
    };

    // Add event listeners
    enhancedLabService.on('connected', handleConnected);
    enhancedLabService.on('disconnected', handleDisconnected);
    enhancedLabService.on('task-started', handleTaskStarted);
    enhancedLabService.on('task-completed', handleTaskCompleted);
    enhancedLabService.on('validation-enhanced-complete', handleValidationComplete);

    return () => {
      enhancedLabService.off('connected', handleConnected);
      enhancedLabService.off('disconnected', handleDisconnected);
      enhancedLabService.off('task-started', handleTaskStarted);
      enhancedLabService.off('task-completed', handleTaskCompleted);
      enhancedLabService.off('validation-enhanced-complete', handleValidationComplete);
    };
  };

  const cleanupEventListeners = setupEventListeners;

  const handleTaskSelection = (task: Task) => {
    setCurrentTask(task);
    // Start the task
    if (sessionId) {
      enhancedLabService.startTask(task.id, sessionId).then((attempt) => {
        setAttemptId(attempt.attemptId);
      }).catch(console.error);
    }
  };

  const handleValidateTask = () => {
    if (currentTask && attemptId) {
      // Switch to validation tab and trigger validation
      setActiveTab('validation');
    }
  };

  const handleCommand = (command: string) => {
    setCommandHistory(prev => [...prev, command]);
  };

  const handleTerminalOutput = (output: string) => {
    setTerminalOutput(prev => [...prev, output]);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">Initializing Lab Workspace</h3>
          <p className="text-gray-600">Setting up your learning environment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Error Loading Workspace</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeWorkspace}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!lab) {
    return null;
  }

  return (
    <div className={`flex flex-col h-screen ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lab.title}</h1>
            <p className="text-gray-600">{lab.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              lab.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
              lab.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {lab.difficulty.charAt(0).toUpperCase() + lab.difficulty.slice(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="flex-shrink-0 w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Tasks</h3>

            <div className="space-y-2">
              {lab.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskSelection(task)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    currentTask?.id === task.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-xs text-gray-500">{task.estimatedTime}m</span>
                  </div>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  {task.isOptional && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Optional
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Current Task Details */}
            {currentTask && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Current Task</h4>
                <h5 className="font-medium text-blue-900 mb-2">{currentTask.title}</h5>

                <div className="prose prose-sm text-gray-600 mb-4">
                  <div dangerouslySetInnerHTML={{ __html: currentTask.instructions.replace(/\n/g, '<br/>') }} />
                </div>

                <button
                  onClick={handleValidateTask}
                  disabled={!attemptId}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Validate Task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'terminal', name: 'Terminal', icon: '💻' },
                { id: 'progress', name: 'Progress', icon: '📊' },
                { id: 'validation', name: 'Validation', icon: '✅' },
                { id: 'dashboard', name: 'Dashboard', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'terminal' && (
              <EnhancedTerminal
                sessionId={sessionId || undefined}
                userId={userId}
                labId={labId}
                taskId={currentTask?.id}
                onCommand={handleCommand}
                onOutput={handleTerminalOutput}
                className="h-full"
              />
            )}

            {activeTab === 'progress' && (
              <div className="h-full overflow-y-auto p-6">
                <LabTaskProgress
                  labId={labId}
                  userId={userId}
                  onTaskComplete={(taskId, result) => {
                    console.log('Task completed:', taskId, result);
                  }}
                  onLabComplete={(result) => {
                    console.log('Lab completed:', result);
                  }}
                />
              </div>
            )}

            {activeTab === 'validation' && currentTask && attemptId && (
              <div className="h-full overflow-y-auto p-6">
                <ValidationProgress
                  taskId={currentTask.id}
                  userId={userId}
                  attemptId={attemptId}
                  validationData={validationData || {}}
                  onComplete={(result) => {
                    console.log('Validation completed:', result);
                  }}
                  onError={(error) => {
                    console.error('Validation error:', error);
                  }}
                />
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="h-full overflow-y-auto p-6">
                <ProgressDashboard
                  userId={userId}
                  labId={labId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
