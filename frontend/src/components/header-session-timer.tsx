'use client'

import { useLabSession } from "@/contexts/LabSessionContext"
import { LabSessionTimer } from "@/components/lab-session-timer"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function HeaderSessionTimer() {
  const { labSession, setLabSession, isInLabWorkspace } = useLabSession()
  const router = useRouter()

  // Debug logs to check what's happening
  console.log('HeaderSessionTimer - isInLabWorkspace:', isInLabWorkspace)
  console.log('HeaderSessionTimer - labSession:', labSession)

  // For now, let's just check if we have a labSession, not the workspace check
  if (!labSession) {
    return null
  }

  const handleSessionEnd = () => {
    toast.success('Lab session ended')
    router.push(`/user/labs/${labSession.labId}`)
  }

  const handleSessionPause = async () => {
    // Update the session status in context to reflect paused state
    setLabSession({
      ...labSession,
      status: 'paused'
    })
    toast.info('Lab session paused - timer stopped')
  }

  const handleSessionResume = async () => {
    // Update the session status in context to reflect active state
    setLabSession({
      ...labSession,
      status: 'active'
    })
    toast.success('Lab session resumed - timer restarted')
  }

  return (
    <div className="flex items-center">
      <LabSessionTimer
        session={labSession}
        onSessionEnd={handleSessionEnd}
        onSessionPause={handleSessionPause}
        onSessionResume={handleSessionResume}
        compact={true}
      />
    </div>
  )
}
