'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(0)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [lastServerSync, setLastServerSync] = useState<number>(0)
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
  const fetchTimeInfo = useCallback(async (forceSync = false) => {
    if (!session?.id) return

    console.log('⏱️  Fetching time info for session:', session.id, { forceSync, isInitialized })
    try {
      const response = await fetch(`/api/lab-sessions/${session.id}`)
      console.log('⏱️  Time info response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('⏱️  Server time data:', {
          timeRemaining: data.timeRemaining,
          timeSpent: data.timeSpent,
          totalDuration: data.totalDuration,
          isExpired: data.isExpired
        })

        const now = Date.now()
        setTimeInfo(data)

        // 1. INITIAL LOAD: Always set the server time
        if (!isInitialized) {
          console.log('🚀 Initial timer setup with server time:', data.timeRemaining)
          setLocalTimeRemaining(data.timeRemaining)
          setIsInitialized(true)
          setLastServerSync(now)
          return
        }

        // 2. PERIODIC SYNC: Only update if there's significant drift or force sync
        const currentLocal = localTimeRemaining
        const serverTime = data.timeRemaining
        const drift = Math.abs(currentLocal - serverTime)

        if (forceSync || drift > 5) {
          console.log('🔄 Syncing timer due to drift:', {
            local: currentLocal,
            server: serverTime,
            drift,
            forceSync
          })
          setLocalTimeRemaining(serverTime)
        } else {
          console.log('✅ Timer in sync, keeping local countdown:', {
            local: currentLocal,
            server: serverTime,
            drift
          })
        }

        setLastServerSync(now)

        // Auto-end session if expired
        if (data.isExpired && session.status === 'active') {
          toast.error('Lab session has expired')
          handleEndSession('expired')
        }
      } else {
        console.error('❌ Failed to fetch time info, status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ Failed to fetch session time info:', error)
    }
  }, [session?.id, session?.status, isInitialized, localTimeRemaining])  // Update session activity (heartbeat)
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
        await fetchTimeInfo(true) // Force sync after session action

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

  // Reset initialization state when session changes
  useEffect(() => {
    if (session?.id) {
      console.log('🔄 Session changed, resetting timer initialization:', session.id)
      setIsInitialized(false)
      setLocalTimeRemaining(0)
      setTimeInfo(null)
      setLastServerSync(0)
    }
  }, [session?.id])
  useEffect(() => {
    if (!session?.id) return

    // Initial fetch with force sync to get server time
    fetchTimeInfo(true)

    // Set up intervals
    const timeUpdateInterval = setInterval(() => {
      // Periodic sync every 60 seconds (no force sync - only sync if drift detected)
      fetchTimeInfo(false)
    }, 60000)

    const forceSyncInterval = setInterval(() => {
      // Force sync every 60 seconds to prevent long-term drift
      fetchTimeInfo(true)
    }, 60000)

    const activityInterval = setInterval(updateActivity, 60000) // Heartbeat every 30 seconds

    return () => {
      clearInterval(timeUpdateInterval)
      clearInterval(forceSyncInterval)
      clearInterval(activityInterval)
    }
  }, [session?.id, fetchTimeInfo, updateActivity])

  // Local smooth countdown - runs independently every second
  useEffect(() => {
    if (!session?.id || session.status !== 'active' || !isInitialized) return

    console.log('🎯 Starting local countdown timer')
    const countdownInterval = setInterval(() => {
      setLocalTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1)

        // Log every 10 seconds for debugging
        if (newTime % 10 === 0) {
          console.log('⏱️  Local timer tick:', {
            remaining: newTime,
            formatted: formatTime(newTime)
          })
        }

        // If time reaches 0, trigger session end
        if (newTime === 0 && prev > 0) {
          console.log('⏰ Timer expired, ending session')
          toast.error('Lab session has expired')
          handleEndSession('expired')
        }

        return newTime
      })
    }, 1000) // Update every second

    return () => {
      console.log('🛑 Stopping local countdown timer')
      clearInterval(countdownInterval)
    }
  }, [session?.status, session?.id, isInitialized])

  if (!session) {
    return null
  }

  // Show basic timer even without timeInfo for debugging
  if (!timeInfo || !isInitialized) {
    return (
      <div className={`flex items-center gap-4 ${compact ? 'text-sm' : 'text-base'}`}>
        <div className="flex items-center gap-2">
          <Clock className={compact ? "h-4 w-4" : "h-5 w-5"} />
          <Badge variant="secondary">
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Badge>
        </div>
        <div className={`font-mono font-bold text-muted-foreground ${compact ? 'text-lg' : 'text-2xl'}`}>
          {isInitialized ? formatTime(localTimeRemaining) : 'Loading...'}
        </div>
      </div>
    )
  }

  const getTimeColor = () => {
    const timeToCheck = localTimeRemaining || timeInfo?.timeRemaining || 0
    if (timeToCheck < 300) return 'text-red-600' // < 5 minutes
    if (timeToCheck < 900) return 'text-yellow-600' // < 15 minutes
    return 'text-green-600'
  }

  const getStatusColor = () => {
    const timeToCheck = localTimeRemaining || timeInfo?.timeRemaining || 0
    switch (session.status) {
      case 'active': return timeToCheck < 300 ? 'destructive' : 'default' // Red if < 5 minutes
      case 'paused': return 'secondary'
      case 'completed': return 'default'
      case 'expired': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <>
      <div className={`flex items-center gap-4 ${compact ? 'text-sm' : 'text-base'}`}>
        {/* Timer Icon and Status */}
        <div className="flex items-center gap-2">
          <Clock className={compact ? "h-4 w-4" : "h-5 w-5"} />
          <Badge variant={getStatusColor()}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Badge>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center gap-2">
          <div className={`font-mono font-bold ${getTimeColor()} ${compact ? 'text-lg' : 'text-2xl'}`}>
            {formatTime(localTimeRemaining || timeInfo.timeRemaining)}
          </div>
          {!compact && (
            <span className="text-sm text-muted-foreground">remaining</span>
          )}
        </div>

        {/* Progress Bar */}
        {!compact && (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={timeInfo.percentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {Math.round(timeInfo.percentage)}%
            </span>
          </div>
        )}

        {/* Warning for low time */}
        {(localTimeRemaining || timeInfo.timeRemaining) < 300 && (localTimeRemaining || timeInfo.timeRemaining) > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            {!compact && (
              <span className="text-sm text-red-500">Low time!</span>
            )}
          </div>
        )}

        {/* Session Controls */}
        <div className="flex gap-1">
          {session.status === 'active' && timeInfo.canPause && (
            <Button
              variant="outline"
              size={compact ? "sm" : "sm"}
              onClick={handlePauseSession}
              disabled={loading}
            >
              <Pause className="h-4 w-4" />
              {!compact && <span className="ml-1">Pause</span>}
            </Button>
          )}

          {session.status === 'paused' && timeInfo.canResume && (
            <Button
              variant="outline"
              size={compact ? "sm" : "sm"}
              onClick={() => handleSessionAction('resume')}
              disabled={loading}
            >
              <Play className="h-4 w-4" />
              {!compact && <span className="ml-1">Resume</span>}
            </Button>
          )}

          {(session.status === 'active' || session.status === 'paused') && (
            <Button
              variant="destructive"
              size={compact ? "sm" : "sm"}
              onClick={() => handleEndSession('completed')}
              disabled={loading}
            >
              <Square className="h-4 w-4" />
              {!compact && <span className="ml-1">End</span>}
            </Button>
          )}
        </div>
      </div>

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
