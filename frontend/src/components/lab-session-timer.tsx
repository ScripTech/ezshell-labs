'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Pause, Play, Square, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface SessionTimeInfo {
  timeRemaining: number // in seconds
  totalDuration: number // in seconds
  timeSpent: number // in seconds
  percentage: number // progress percentage
  isExpired: boolean
  canPause: boolean
  canResume: boolean
}

interface LabSession {
  id: string
  status: string
  labId: string
  sessionName?: string
}

interface LabSessionTimerProps {
  session: LabSession | null
  onSessionEnd?: () => void
  onSessionPause?: () => void
  onSessionResume?: () => void
  compact?: boolean // New prop for compact display
}

export function LabSessionTimer({
  session,
  onSessionEnd,
  onSessionPause,
  onSessionResume,
  compact = false
}: LabSessionTimerProps) {
  const [timeInfo, setTimeInfo] = useState<SessionTimeInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showPauseDialog, setShowPauseDialog] = useState(false)

  // Format time from seconds to HH:MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // Fetch session time info
  const fetchTimeInfo = useCallback(async () => {
    if (!session?.id) return

    try {
      const response = await fetch(`/api/lab-sessions/${session.id}`)
      if (response.ok) {
        const data = await response.json()
        setTimeInfo(data)

        // Auto-end session if expired
        if (data.isExpired && session.status === 'active') {
          toast.error('Lab session has expired')
          handleEndSession('expired')
        }
      }
    } catch (error) {
      console.error('Failed to fetch session time info:', error)
    }
  }, [session?.id, session?.status])

  // Update session activity (heartbeat)
  const updateActivity = useCallback(async () => {
    if (!session?.id || session.status !== 'active') return

    try {
      await fetch(`/api/lab-sessions/${session.id}`, {
        method: 'PATCH'
      })
    } catch (error) {
      console.error('Failed to update session activity:', error)
    }
  }, [session?.id, session?.status])

  // Handle session actions
  const handleSessionAction = async (action: string) => {
    if (!session?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/lab-sessions/${session.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await fetchTimeInfo()

        switch (action) {
          case 'pause':
            toast.success('Lab session paused')
            onSessionPause?.()
            break
          case 'resume':
            toast.success('Lab session resumed')
            onSessionResume?.()
            break
          case 'end':
            toast.success('Lab session completed')
            onSessionEnd?.()
            break
          case 'abandon':
            toast.warning('Lab session abandoned')
            onSessionEnd?.()
            break
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Session action failed:', error)
      toast.error('Failed to perform action')
    } finally {
      setLoading(false)
    }
  }

  const handlePauseSession = () => {
    setShowPauseDialog(true)
  }

  const handleEndSession = (type: 'completed' | 'abandoned' | 'expired') => {
    if (type === 'expired') {
      handleSessionAction('end')
    } else {
      setShowEndDialog(true)
    }
  }

  // Set up intervals for fetching time info and updating activity
  useEffect(() => {
    if (!session?.id) return

    // Initial fetch
    fetchTimeInfo()

    // Set up intervals
    const timeUpdateInterval = setInterval(fetchTimeInfo, 10000) // Update every 10 seconds
    const activityInterval = setInterval(updateActivity, 30000) // Heartbeat every 30 seconds

    return () => {
      clearInterval(timeUpdateInterval)
      clearInterval(activityInterval)
    }
  }, [session?.id, fetchTimeInfo, updateActivity])

  if (!session || !timeInfo) {
    return null
  }

  const getStatusColor = () => {
    switch (session.status) {
      case 'active': return timeInfo.timeRemaining < 300 ? 'destructive' : 'default' // Red if < 5 minutes
      case 'paused': return 'secondary'
      case 'completed': return 'default'
      case 'expired': return 'destructive'
      default: return 'default'
    }
  }

  const getTimeColor = () => {
    if (timeInfo.timeRemaining < 300) return 'text-red-600' // < 5 minutes
    if (timeInfo.timeRemaining < 900) return 'text-yellow-600' // < 15 minutes
    return 'text-green-600'
  }

  return (
    <>
      <Card className={`w-full ${compact ? 'max-w-sm' : 'max-w-md'}`}>
        <CardHeader className={compact ? "pb-2" : "pb-3"}>
          <CardTitle className={`flex items-center gap-2 ${compact ? "text-base" : "text-lg"}`}>
            <Clock className={compact ? "h-4 w-4" : "h-5 w-5"} />
            {compact ? "Timer" : "Lab Session Timer"}
            <Badge variant={getStatusColor()} className="ml-auto">
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
          </CardTitle>
          {!compact && (
            <CardDescription>
              {session.sessionName || `Session ${session.id.slice(0, 8)}`}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Time Remaining */}
          <div className="text-center">
            <div className={`text-3xl font-mono font-bold ${getTimeColor()}`}>
              {formatTime(timeInfo.timeRemaining)}
            </div>
            <div className="text-sm text-muted-foreground">
              Time Remaining
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={timeInfo.percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Time Spent: {formatTime(timeInfo.timeSpent)}</span>
              <span>Total: {formatTime(timeInfo.totalDuration)}</span>
            </div>
          </div>

          {/* Warning for low time */}
          {timeInfo.timeRemaining < 900 && timeInfo.timeRemaining > 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-600">
                {timeInfo.timeRemaining < 300 ? 'Less than 5 minutes remaining!' : 'Less than 15 minutes remaining'}
              </span>
            </div>
          )}

          {/* Session Controls */}
          <div className="flex gap-2">
            {session.status === 'active' && timeInfo.canPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseSession}
                disabled={loading}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}

            {session.status === 'paused' && timeInfo.canResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSessionAction('resume')}
                disabled={loading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}

            {(session.status === 'active' || session.status === 'paused') && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleEndSession('completed')}
                disabled={loading}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1" />
                End Lab
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pause Confirmation Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Lab Session?</DialogTitle>
            <DialogDescription>
              This will pause your lab session. You can resume it later, but the total time limit will still apply.
              Your progress will be saved automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSessionAction('pause')
                setShowPauseDialog(false)
              }}
            >
              Pause Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Session Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Lab Session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this lab session? This action cannot be undone.
              Your current progress will be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleSessionAction('abandon')
                setShowEndDialog(false)
              }}
            >
              Abandon Session
            </Button>
            <Button
              onClick={() => {
                handleSessionAction('end')
                setShowEndDialog(false)
              }}
            >
              Complete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
