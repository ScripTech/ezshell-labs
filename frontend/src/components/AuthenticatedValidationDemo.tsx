import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { useTaskValidation } from '@/hooks/useAuthenticatedSocket';
import { useSession } from 'next-auth/react';

interface ValidationStepResult {
  step: string;
  status: 'loading' | 'success' | 'failed';
  timestamp?: string;
}

export function AuthenticatedValidationDemo() {
  const { data: session } = useSession();
  const { validateTask, requestProgressSummary, isReady, socket } = useTaskValidation();

  const [isValidating, setIsValidating] = useState(false);
  const [validationSteps, setValidationSteps] = useState<ValidationStepResult[]>([]);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    score: number;
    maxScore: number;
    attemptNumber: number;
  } | null>(null);
  const [progressData, setProgressData] = useState<any>(null);

  // Listen for validation step updates
  useEffect(() => {
    if (socket) {
      const handleValidationStep = (data: ValidationStepResult) => {
        setValidationSteps(prev => {
          const existing = prev.find(step => step.step === data.step);
          if (existing) {
            return prev.map(step =>
              step.step === data.step ? { ...step, ...data } : step
            );
          } else {
            return [...prev, data];
          }
        });
      };

      const handleValidationComplete = (data: any) => {
        setIsValidating(false);
        setValidationResult(data);
        console.log('✅ Validation completed:', data);
      };

      const handleValidationError = (data: any) => {
        setIsValidating(false);
        console.error('❌ Validation error:', data);
      };

      const handleProgressSummary = (data: any) => {
        setProgressData(data);
        console.log('📊 Progress summary received:', data);
      };

      // Listen for validation events with question ID
      socket.on('validation-demo-task-step', handleValidationStep);
      socket.on('validation-demo-task-complete', handleValidationComplete);
      socket.on('validation-demo-task-error', handleValidationError);
      socket.on('progress-summary', handleProgressSummary);

      return () => {
        socket.off('validation-demo-task-step', handleValidationStep);
        socket.off('validation-demo-task-complete', handleValidationComplete);
        socket.off('validation-demo-task-error', handleValidationError);
        socket.off('progress-summary', handleProgressSummary);
      };
    }
  }, [socket]);

  const handleValidateFilePermissions = async () => {
    if (!isReady) {
      alert('Socket not ready or user not authenticated');
      return;
    }

    setIsValidating(true);
    setValidationSteps([]);
    setValidationResult(null);

    try {
      // Test the legacy validation system
      await validateTask('question-9-file-permissions', 'ex200', {
        type: 'file-permissions',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Validation failed:', error);
      setIsValidating(false);
    }
  };

  const handleValidateTarArchive = async () => {
    if (!isReady) {
      alert('Socket not ready or user not authenticated');
      return;
    }

    setIsValidating(true);
    setValidationSteps([]);
    setValidationResult(null);

    try {
      await validateTask('question-8-create-tar-archive', 'ex200', {
        type: 'tar-archive',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Validation failed:', error);
      setIsValidating(false);
    }
  };

  const handleValidateNetworkConfig = async () => {
    if (!isReady) {
      alert('Socket not ready or user not authenticated');
      return;
    }

    setIsValidating(true);
    setValidationSteps([]);
    setValidationResult(null);

    try {
      await validateTask('question-1-network-config', 'ex200', {
        type: 'network-config',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Validation failed:', error);
      setIsValidating(false);
    }
  };

  const handleRequestProgress = async () => {
    if (!isReady) {
      alert('Socket not ready or user not authenticated');
      return;
    }

    try {
      await requestProgressSummary('ex200');
    } catch (error) {
      console.error('Failed to request progress:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary">Loading</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Authenticated Task Validation Demo
          </CardTitle>
          <CardDescription>
            This demo shows the new authenticated validation system with progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{session?.user?.name || 'Anonymous'}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isReady ? 'default' : 'secondary'}>
                  {isReady ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleValidateFilePermissions}
              disabled={!isReady || isValidating}
            >
              {isValidating ? 'Validating...' : 'Test File Permissions'}
            </Button>
            <Button
              onClick={handleValidateTarArchive}
              disabled={!isReady || isValidating}
              variant="secondary"
            >
              {isValidating ? 'Validating...' : 'Test Tar Archive'}
            </Button>
            <Button
              onClick={handleValidateNetworkConfig}
              disabled={!isReady || isValidating}
              variant="secondary"
            >
              {isValidating ? 'Validating...' : 'Test Network Config'}
            </Button>
            <Button
              variant="outline"
              onClick={handleRequestProgress}
              disabled={!isReady}
            >
              Request Progress Summary
            </Button>
          </div>

          {/* Validation Steps */}
          {validationSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Validation Steps:</h4>
              {validationSteps.map((step, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(step.status)}
                    <span className="text-sm">{step.step}</span>
                  </div>
                  {getStatusBadge(step.status)}
                </div>
              ))}
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <div className="p-4 border rounded-lg bg-muted">
              <h4 className="font-medium mb-2">Validation Result:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Success:</span>
                  <span className={`ml-2 font-medium ${validationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResult.success ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Score:</span>
                  <span className="ml-2 font-medium">
                    {validationResult.score}/{validationResult.maxScore}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Attempt:</span>
                  <span className="ml-2 font-medium">#{validationResult.attemptNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Percentage:</span>
                  <span className="ml-2 font-medium">
                    {Math.round((validationResult.score / validationResult.maxScore) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Progress Data */}
          {progressData && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium mb-2">📊 Progress Summary:</h4>
              <div className="space-y-2 text-sm">
                {progressData.insights && (
                  <div>
                    <span className="text-muted-foreground">Learning Insights:</span>
                    <pre className="ml-2 text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(progressData.insights, null, 2)}
                    </pre>
                  </div>
                )}
                {progressData.activeSession && (
                  <div>
                    <span className="text-muted-foreground">Active Session:</span>
                    <pre className="ml-2 text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(progressData.activeSession, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
