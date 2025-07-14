'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, AlertTriangle, RotateCcw, History } from 'lucide-react'
import { TaskProgressData, ValidationStep } from '@/hooks/useTaskValidation'

interface TaskProgressProps {
  progress: TaskProgressData
  onReset?: () => void
  showHistory?: boolean
  onShowHistory?: () => void
}

export function TaskProgress({ progress, onReset, showHistory = false, onShowHistory }: TaskProgressProps) {
  const getStatusBadge = () => {
    if (progress.completed) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
    }
    
    if (!progress.canAttempt) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
    }
    
    if (progress.attempts > 0) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>
    }
    
    return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Not Started</Badge>
  }

  const getScorePercentage = () => {
    // Assuming max score could be calculated from validation steps or we could add it to progress
    // For now, let's use a simple calculation
    const maxPossibleScore = 100 // This should come from task configuration
    return (progress.score / maxPossibleScore) * 100
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Task Progress
            {getStatusBadge()}
          </CardTitle>
          <div className="flex gap-2">
            {showHistory && onShowHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowHistory}
              >
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            )}
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Track your validation attempts and scores for this task
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Score</span>
            <span className="font-medium">{progress.score} points</span>
          </div>
          <Progress value={getScorePercentage()} className="h-2" />
        </div>

        {/* Attempts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Attempts Used</div>
            <div className="text-2xl font-bold">
              {progress.attempts} / {progress.maxAttempts}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Remaining</div>
            <div className="text-2xl font-bold text-blue-600">
              {progress.remainingAttempts}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {!progress.canAttempt && !progress.completed && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Maximum attempts reached</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              You have used all {progress.maxAttempts} attempts for this task.
            </p>
          </div>
        )}

        {progress.completed && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Task completed successfully!</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Final score: {progress.score} points
            </p>
          </div>
        )}

        {progress.canAttempt && !progress.completed && progress.attempts > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                You have {progress.remainingAttempts} attempts remaining
              </span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Current best score: {progress.score} points
            </p>
          </div>
        )}

        {/* Last Attempt */}
        {progress.lastAttemptAt && (
          <div className="text-sm text-muted-foreground">
            Last attempt: {new Date(progress.lastAttemptAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ValidationHistoryProps {
  history: any[]
  isOpen: boolean
  onClose: () => void
}

export function ValidationHistory({ history, isOpen, onClose }: ValidationHistoryProps) {
  if (!isOpen) return null

  return (
    <Card className="w-full mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Validation History</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {history.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No validation attempts yet
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((attempt, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Attempt {attempt.attemptNumber}</span>
                  <div className="flex items-center gap-2">
                    {attempt.passed ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />Passed
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />Failed
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(attempt.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm">
                  Score: {attempt.score} points
                </div>
                
                {attempt.steps && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Validation Steps:</div>
                    {attempt.steps.map((step: ValidationStep, stepIndex: number) => (
                      <div key={stepIndex} className="flex items-center gap-2 text-sm">
                        {step.passed ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span>{step.description}</span>
                        <span className="text-muted-foreground">({step.points} pts)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
