'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface ValidationStep {
  id: string
  description: string
  passed: boolean
  points: number
  errorMessage?: string
}

export interface ValidationResult {
  stepResults: ValidationStep[]
  totalScore: number
  maxScore: number
  passed: boolean
  attemptNumber: number
  remainingAttempts: number
}

export interface TaskProgressData {
  id: string
  userId: string
  labTaskId: string
  labEnrollmentId: string
  score: number
  completed: boolean
  attempts: number
  maxAttempts: number
  remainingAttempts: number
  canAttempt: boolean
  lastAttemptAt: Date | null
  validationResults: any[]
}

export function useTaskValidation(taskId: string, enrollmentId: string) {
  const [progress, setProgress] = useState<TaskProgressData | null>(null)
  const [loading, setLoading] = useState(false)
  const [validationHistory, setValidationHistory] = useState<any[]>([])

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/task-validation/${taskId}?enrollmentId=${enrollmentId}`)

      if (response.ok) {
        const data = await response.json()
        setProgress(data)
        return data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to fetch task progress')
        return null
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
      toast.error('Failed to fetch task progress')
      return null
    } finally {
      setLoading(false)
    }
  }, [taskId, enrollmentId])

  const submitValidation = useCallback(async (validationSteps: ValidationStep[]): Promise<ValidationResult | null> => {
    try {
      setLoading(true)

      // Check if user can still attempt
      if (progress && !progress.canAttempt) {
        toast.error(`Maximum attempts (${progress.maxAttempts}) reached for this task`)
        return null
      }

      const response = await fetch(`/api/task-validation/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          labEnrollmentId: enrollmentId,
          validationSteps
        })
      })

      if (response.ok) {
        const result = await response.json()

        // Refresh progress after validation
        await fetchProgress()

        // Show appropriate toast
        if (result.passed) {
          toast.success(`Task completed! Score: ${result.totalScore}/${result.maxScore}`)
        } else {
          toast.warning(`Attempt ${result.attemptNumber} completed. Score: ${result.totalScore}/${result.maxScore}. ${result.remainingAttempts} attempts remaining.`)
        }

        return result
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit validation')
        return null
      }
    } catch (error) {
      console.error('Error submitting validation:', error)
      toast.error('Failed to submit validation')
      return null
    } finally {
      setLoading(false)
    }
  }, [taskId, enrollmentId, progress, fetchProgress])

  const fetchValidationHistory = useCallback(async () => {
    try {
      const response = await fetch(`/ws/api/task-validation/${taskId}/history?enrollmentId=${enrollmentId}`)

      if (response.ok) {
        const data = await response.json()
        setValidationHistory(data)
        return data
      } else {
        console.error('Failed to fetch validation history')
        return []
      }
    } catch (error) {
      console.error('Error fetching validation history:', error)
      return []
    }
  }, [taskId, enrollmentId])

  return {
    progress,
    loading,
    validationHistory,
    fetchProgress,
    submitValidation,
    fetchValidationHistory,
    canAttempt: progress?.canAttempt ?? true,
    remainingAttempts: progress?.remainingAttempts ?? 3,
    currentScore: progress?.score ?? 0,
    isCompleted: progress?.completed ?? false
  }
}
