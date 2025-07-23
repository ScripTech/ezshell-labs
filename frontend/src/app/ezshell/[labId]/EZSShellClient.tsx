"use client"

import React, { Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShellSectionComponent } from './components/shell-section'
import { TaskSection } from './components/task-section'
import { useLabSession } from '@/contexts/LabSessionContext'
import { useAuthenticatedSocket } from '@/hooks/useAuthenticatedSocket'
import { useSession, SessionProvider } from 'next-auth/react'
import { toast } from 'sonner'

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="container-shell flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p>Loading...</p>
    </div>
  </div>
)

const EZSShellViewContent = () => {
  const params = useParams()
  const labId = params.labId as string
  const { data: session } = useSession()
  const { socket, isConnected, isAuthenticated, connect, disconnect } = useAuthenticatedSocket(labId)
  const searchParams = useSearchParams()
  const router = useRouter()
  const routerRef = React.useRef(router)
  const [termPanelSize, setTermPanelSize] = React.useState<number>(63)
  const { labSession, labInfo, setLabSession, setLabInfo } = useLabSession()
  const [loading, setLoading] = React.useState(true)

  // Create a ref for the socket to maintain compatibility with TaskSection
  const socketRef = React.useRef(socket)

  // Update router ref
  React.useEffect(() => {
    routerRef.current = router
  }, [router])

  const sessionId = searchParams.get('session')
  const enrollmentId = searchParams.get('enrollment')

  // Connect socket when session is ready
  React.useEffect(() => {
    if (session?.user && !isConnected) {
      // Add a small delay to ensure the token is ready
      const timer = setTimeout(() => {
        connect().catch((error) => {
          console.error('Socket connection failed:', error)
          toast.error('Failed to connect to lab environment')
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [session, isConnected, connect])

  // Update socket ref when socket changes
  React.useEffect(() => {
    socketRef.current = socket
  }, [socket])

  // Fetch or create lab session
  React.useEffect(() => {
    const initializeSession = async () => {
      console.log('🔄 Session initialization starting...', {
        labId,
        sessionId,
        hasExistingSession: !!labSession,
        existingSessionId: labSession?.id
      })

      if (!labId) {
        toast.error('No lab specified')
        routerRef.current.push('/user/labs')
        return
      }

      // Skip initialization if we already have a session
      if (labSession) {
        console.log('✅ Session already exists, skipping initialization:', labSession.id)
        return
      }

      try {
        setLoading(true)

        // If we have a session ID, try to get session info
        if (sessionId) {
          console.log('🔍 Fetching session by ID:', sessionId)
          const sessionResponse = await fetch(`/api/lab-sessions/${sessionId}`)
          if (sessionResponse.ok) {
            const timeInfo = await sessionResponse.json()
            console.log('⏱️  Time info for existing session:', timeInfo)
            // Get full session details
            const activeSessionResponse = await fetch(`/api/lab-sessions?labId=${labId}`)
            if (activeSessionResponse.ok) {
              const sessionData = await activeSessionResponse.json()
              if (sessionData && sessionData.id === sessionId) {
                console.log('✅ Found existing session with time info:', {
                  sessionId: sessionData.id,
                  status: sessionData.status,
                  timeRemaining: timeInfo.timeRemaining,
                  totalDuration: timeInfo.totalDuration,
                  timeSpent: timeInfo.timeSpent
                })
                setLabSession(sessionData)
                return // Exit early, we found the session
              }
            }
          } else {
            console.warn('❌ Session ID not found:', sessionId)
          }
        }

        // Check for active session first
        console.log('🔍 Checking for active session...')
        const activeSessionResponse = await fetch(`/api/lab-sessions?labId=${labId}`)
        if (activeSessionResponse.ok) {
          const activeSession = await activeSessionResponse.json()
          if (activeSession) {
            console.log('✅ Found active session:', {
              sessionId: activeSession.id,
              status: activeSession.status,
              startedAt: activeSession.startedAt,
              expiresAt: activeSession.expiresAt
            })
            setLabSession(activeSession)
            // Update URL with session ID if different
            if (sessionId !== activeSession.id) {
              console.log('🔄 Updating URL with correct session ID')
              router.replace(`/ezshell/${ labId }/?enrollment=${ enrollmentId }&session=${ activeSession.id }`)
            }
            return // Exit early, we found an active session
          }
        }

        // Only create new session if no active session exists
        console.log('❌ No active session found, creating new one...', labId)
        const createResponse = await fetch('/api/lab-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labId })
        })

        if (createResponse.ok) {
          const newSession = await createResponse.json()
          console.log('✅ Created new session:', {
            sessionId: newSession.id,
            status: newSession.status,
            duration: newSession.duration
          })
          setLabSession(newSession)
          router.replace(`/ezshell/${ labId }/?enrollment=${ enrollmentId }&session=${newSession.id}`)
          toast.success('Lab session started!')
        } else {
          console.error('❌ Failed to create session')
          toast.error('Failed to start lab session')
        }

        // Get lab information
        const labResponse = await fetch(`/api/labs/${labId}`)
        if (labResponse.ok) {
          const lab = await labResponse.json()
          setLabInfo(lab)
        }

      } catch (error) {
        console.error('❌ Error initializing session:', error)
        toast.error('Failed to initialize lab session')
      } finally {
        setLoading(false)
      }
    }

    initializeSession()
  }, [labId, sessionId, router])


  React.useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  if (loading || !session || !isConnected || !isAuthenticated) {
    return (
      <div className="container-shell flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>
            {!session ? 'Authenticating...' :
              !isConnected ? 'Connecting to lab environment...' :
                !isAuthenticated ? 'Authenticating with lab environment...' :
                  'Initializing lab session...'}
          </p>
          {session && (
            <div className="mt-2 text-sm text-muted-foreground">
              Socket: {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
              {isAuthenticated && ' (Authenticated)'}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container-shell">
      {/* Lab Info Header */}
      {labInfo && !labSession && (
        <div className="mb-4">
          <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600">
              No active session found. Please enroll in this lab to start a timed session.
            </p>
          </div>
        </div>
      )}

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.20))] px-4 pt-2 rounded-md'>
          <TaskSection socketRef={socketRef} questionId={''} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.12))] bg-background rounded-sm'
          collapsible={false}
          defaultSize={55}
          minSize={termPanelSize}
          maxSize={63}
          onResize={(e) => {
            setTermPanelSize(e)
          }}
        >
          <ScrollArea>
            <ShellSectionComponent labId={labId} questionId={""} />
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

// Wrapper component that uses useSearchParams
const EZSShellViewWithParams = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EZSShellViewContent />
    </Suspense>
  )
}

export const EZSShellClient = () => {
  return (
    <SessionProvider>
      <EZSShellViewWithParams />
    </SessionProvider>
  )
}
