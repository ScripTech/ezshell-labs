'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Clock, AlertCircle, Loader2, ExternalLink, Copy, Timer } from 'lucide-react'
import { toast } from 'sonner'

interface ProvisioningStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  duration?: string
}

interface ProvisioningStepsResponse {
  enrollmentId: string
  overallStatus: 'queued' | 'in_progress' | 'completed' | 'failed'
  progressPercentage: number
  steps: {
    step: 'enrollment' | 'aws_instance_creation' | 'environment_setup' | 'lab_ready'
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    completedAt?: string
    error?: string
  }[]
  connection?: {
    ready: boolean
    ssh?: {
      command: string
      host: string
      username: string
      keyFile: string
    }
    webAccess?: {
      url: string
      ip: string
    }
  }
}

interface LabProvisioningDialogProps {
  isOpen: boolean
  onClose: () => void
  callbackIsEnrolling: (isEnrolling: boolean) => void
  labId: string
  labName: string
  onProvisioningComplete: (enrollmentId: string) => void
}

export function LabProvisioningDialog({
  isOpen,
  onClose,
  callbackIsEnrolling,
  labId,
  labName,
  onProvisioningComplete
}: LabProvisioningDialogProps) {
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [provisioningStatus, setProvisioningStatus] = useState<ProvisioningStepsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(120) // 2 hours in minutes
  const [isPolling, setIsPolling] = useState(false)

  const steps: ProvisioningStep[] = [
    {
      id: 'enrollment',
      title: 'Lab Enrollment',
      description: 'Enrolling you in the lab and queuing for provisioning',
      status: 'pending'
    },
    {
      id: 'provisioning',
      title: 'AWS Instance Creation',
      description: 'Creating your dedicated lab environment in AWS',
      status: 'pending',
      duration: '2-3 minutes'
    },
    {
      id: 'configuration',
      title: 'Environment Setup',
      description: 'Installing lab tools and configuring your environment',
      status: 'pending',
      duration: '1-2 minutes'
    },
    {
      id: 'ready',
      title: 'Lab Ready',
      description: 'Your lab environment is ready to use',
      status: 'pending'
    }
  ]

  const [provisioningSteps, setProvisioningSteps] = useState<ProvisioningStep[]>(steps)

  // Update steps based on provisioning status
  const updateStepsFromStatus = useCallback((status: ProvisioningStepsResponse) => {
    const newSteps = [...steps]

    // Map backend steps to frontend steps
    const stepMapping = {
      'enrollment': 0,
      'aws_instance_creation': 1,
      'environment_setup': 2,
      'lab_ready': 3
    }

    // Update each step based on backend response
    status.steps.forEach((backendStep) => {
      const stepIndex = stepMapping[backendStep.step]
      if (stepIndex !== undefined && newSteps[stepIndex]) {
        newSteps[stepIndex].status = backendStep.status === 'in_progress' ? 'in-progress' : backendStep.status

        // Set error if step failed
        if (backendStep.status === 'failed' && backendStep.error) {
          setError(backendStep.error)
        }
      }
    })

    // Update current step
    const completedSteps = newSteps.filter(step => step.status === 'completed').length
    const inProgressStep = newSteps.findIndex(step => step.status === 'in-progress')

    if (inProgressStep !== -1) {
      setCurrentStep(inProgressStep)
    } else if (completedSteps === newSteps.length) {
      setCurrentStep(newSteps.length - 1)
    } else {
      setCurrentStep(completedSteps)
    }

    setProvisioningSteps(newSteps)
  }, [])

  // Poll for status updates
  const pollProvisioningStatus = useCallback(async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/lab-provisioner/enrollment/steps/${enrollmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch provisioning steps')
      }

      const status: ProvisioningStepsResponse = await response.json()
      setProvisioningStatus(status)
      updateStepsFromStatus(status)

      // Stop polling if completed or failed
      if (status.overallStatus === 'completed' && status.connection?.ready) {
        setIsPolling(false)
        onProvisioningComplete(enrollmentId)
      } else if (status.overallStatus === 'failed') {
        setIsPolling(false)
        const failedStep = status.steps.find(step => step.status === 'failed')
        setError(failedStep?.error || 'Lab provisioning failed')
      }
    } catch (error) {
      console.error('Failed to poll status:', error)
      // Continue polling on network errors
    }
  }, [updateStepsFromStatus, onProvisioningComplete])

  // Start polling when we have an enrollment ID
  useEffect(() => {
    if (enrollmentId && isPolling) {
      const interval = setInterval(() => {
        pollProvisioningStatus(enrollmentId)
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [enrollmentId, isPolling, pollProvisioningStatus])

  // Countdown timer for lab expiration
  useEffect(() => {
    if (provisioningStatus?.overallStatus === 'completed') {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [provisioningStatus?.overallStatus])

  const formatTimeRemaining = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const handleEnrollment = async () => {
    try {
      callbackIsEnrolling(true)
      setIsEnrolling(true)
      setError(null)

      // Reset all steps to initial state
      const resetSteps = steps.map(step => ({ ...step, status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'failed' }))
      setProvisioningSteps(resetSteps)

      // Update first step to in-progress
      const newSteps = [...resetSteps]
      newSteps[0].status = 'in-progress'
      setProvisioningSteps(newSteps)
      setCurrentStep(0)

      const response = await fetch('/api/lab-provisioner/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enroll in lab')
      }

      const data = await response.json()
      setEnrollmentId(data.data.enrollmentId)

      // Mark enrollment as completed
      const completedSteps = [...provisioningSteps]
      completedSteps[0].status = 'completed'
      setProvisioningSteps(completedSteps)

      // Start polling for provisioning status
      setIsPolling(true)

      toast.success('Successfully enrolled in lab! Provisioning your environment...')
    } catch (error) {
      console.error('Enrollment error:', error)
      setError(error instanceof Error ? error.message : 'Failed to enroll in lab')

      // Mark enrollment as failed
      const failedSteps = [...provisioningSteps]
      failedSteps[0].status = 'failed'
      setProvisioningSteps(failedSteps)
    } finally {
      callbackIsEnrolling(false)
      setIsEnrolling(false)
    }
  }

  const handleAccessLab = () => {
    if (enrollmentId) {
      window.open(`/ezshell/${labId}&enrollment=${enrollmentId}`, '_blank')
    }
  }

  const getStepIcon = (step: ProvisioningStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getProgressValue = () => {
    const completedSteps = provisioningSteps.filter(step => step.status === 'completed').length
    return (completedSteps / provisioningSteps.length) * 100
  }

  const isCompleted = provisioningStatus?.overallStatus === 'completed' && provisioningStatus?.connection?.ready
  const isFailed = error || provisioningStatus?.overallStatus === 'failed'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] transition-all animate-in fade-in-0 slide-in-from-top-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : isFailed ? (
              <AlertCircle className="w-6 h-6 text-red-500" />
              ) : isEnrolling ?  (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ): (<span className='px-2'></span>)}
            Lab Provisioning: {labName}
          </DialogTitle>
          <DialogDescription>
            {isCompleted
              ? 'Your lab environment is ready to use!'
              : isFailed
                ? 'There was an issue provisioning your lab'
                : 'Setting up your dedicated lab environment...'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgressValue())}%</span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </div>

          {/* Time Remaining (if lab is ready) */}
          {isCompleted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Timer className="w-4 h-4" />
                <span className="font-medium">Lab Session Time Remaining</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Your lab will be automatically terminated in {formatTimeRemaining(timeRemaining)}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className=" border  rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Provisioning Failed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {"We are sorry, but there was an issue provisioning your lab environment. Please try again later."}
              </p>
            </div>
          )}

          {/* Provisioning Steps */}
          <div className="space-y-4">
            {provisioningSteps.map((step, index) => (
              <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border`}>
                {getStepIcon(step, index)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    {step.duration && step.status === 'in-progress' && (
                      <span className="text-xs text-muted-foreground">{step.duration}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!enrollmentId && !isEnrolling && (
              <Button onClick={handleEnrollment} className="flex-1">
                Start Lab Provisioning
              </Button>
            )}

            {isCompleted && (
              <Button onClick={handleAccessLab} className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Access Lab Environment
              </Button>
            )}

            {isFailed && (
              <Button onClick={handleEnrollment} variant="outline" className="flex-1">
                Retry Provisioning
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              {isCompleted ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
