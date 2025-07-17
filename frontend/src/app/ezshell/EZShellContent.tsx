"use client"

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShellSectionComponent } from './components/shell-section'
import TaskSectionWithSuspense from './components/task-section'
import { useLabSession } from '@/contexts/LabSessionContext'
import { useAuthenticatedSocket } from '@/hooks/useAuthenticatedSocket'
import { useSession, SessionProvider } from 'next-auth/react'
import { toast } from 'sonner'

function EZShellContentInner() {
  const { data: session } = useSession()
  const { socket, isConnected, isAuthenticated, connect, disconnect } = useAuthenticatedSocket()
  const searchParams = useSearchParams()
  const router = useRouter()

  const { labSession, labInfo, setLabSession, setLabInfo } = useLabSession()

  // Update socket reference when socket changes
  const socketRef = React.useRef(socket)

  const labId = searchParams.get('lab')
  const sessionId = searchParams.get('session')
  const questionId = searchParams.get('question') ?? ''

  // Connect to socket when user is authenticated
  React.useEffect(() => {
    if (session?.user && !isConnected) {
      console.log('Connecting to lab environment...')
      if (connect) {
        connect().catch((error: any) => {
          console.error('Failed to connect:', error)
          toast.error('Failed to connect to lab environment')
        })
      }
    }

    return () => {
      // Optional cleanup
    }
  }, [session, isConnected, connect])

  React.useEffect(() => {
    socketRef.current = socket
  }, [socket])

  // Handle lab session initialization
  React.useEffect(() => {
    if (!labId) {
      if (typeof window !== 'undefined') {
        toast.error('No lab specified')
        router.push('/user/labs')
      }
      return
    }

    const initializeLabSession = async () => {
      try {
        // First, get lab info
        const labResponse = await fetch(`/api/labs/${labId}`)
        if (!labResponse.ok) {
          throw new Error('Failed to fetch lab info')
        }
        const labData = await labResponse.json()
        setLabInfo(labData)

        // Then handle session
        if (sessionId) {
          // Resume existing session
          const sessionResponse = await fetch(`/api/labs/${labId}/sessions/${sessionId}`)
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            setLabSession(sessionData)
          } else {
            toast.error('Session not found, creating new session...')
            // Create new session if the specified one doesn't exist
            await createNewSession(labId)
          }
        } else {
          // Check for active session or create new one
          const activeSessionResponse = await fetch(`/api/labs/${labId}/sessions/active`)
          if (activeSessionResponse.ok) {
            const activeSession = await activeSessionResponse.json()
            if (activeSession) {
              setLabSession(activeSession)
              // Update URL to include session ID
              router.replace(`/ezshell?lab=${labId}&session=${activeSession.id}`)
            } else {
              await createNewSession(labId)
            }
          } else {
            await createNewSession(labId)
          }
        }
      } catch (error) {
        console.error('Failed to initialize lab session:', error)
        toast.error('Failed to initialize lab session')
      }
    }

    const createNewSession = async (labId: string) => {
      try {
        const response = await fetch(`/api/labs/${labId}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to create lab session')
        }

        const newSession = await response.json()
        setLabSession(newSession)

        // Update URL to include session ID
        router.replace(`/ezshell?lab=${labId}&session=${newSession.id}`)

        toast.success('Lab session created successfully')
      } catch (error) {
        console.error('Failed to create lab session:', error)
        toast.error('Failed to create lab session')
      }
    }

    if (session?.user) {
      initializeLabSession()
    }
  }, [labId, sessionId, session, router, setLabInfo, setLabSession])

  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Please sign in to access EZShell</div>
      </div>
    )
  }

  if (!labId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>No lab specified</div>
      </div>
    )
  }

  if (!labInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading lab information...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full">
            <ShellSectionComponent questionId={questionId} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <TaskSectionWithSuspense questionId={questionId} socketRef={socketRef} />
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export const EZShellContent = () => {
  return (
    <SessionProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading EZShell...</div>}>
        <EZShellContentInner />
      </Suspense>
    </SessionProvider>
  )
}
