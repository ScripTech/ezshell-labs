"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface LabSession {
  id: string
  labId: string
  userId: string
  startedAt: string
  expiresAt: string
  status: 'active' | 'paused' | 'completed' | 'expired'
  timeRemaining?: number
  pausedAt?: string
  resumedAt?: string
  totalTimeSpent?: number
}

interface LabSessionContextType {
  labSession: LabSession | null
  labInfo: any
  userSession: any
  setLabSession: (session: LabSession | null) => void
  setLabInfo: (info: any) => void
  isInLabWorkspace: boolean
}

const LabSessionContext = createContext<LabSessionContextType | null>(null)

export function LabSessionProvider({ children }: { children: React.ReactNode }) {
  const [labSession, setLabSession] = useState<LabSession | null>(null)
  const [labInfo, setLabInfo] = useState<any>(null)
  const searchParams = useSearchParams()
  const [userSession, setUserSession] = useState<any>(null)
  const { data: session} = useSession()
  // Check if we're in the lab workspace (ezshell route)
  const isInLabWorkspace = typeof window !== 'undefined' &&
    window.location.pathname.includes('/ezshell')


  useEffect(() => {
    setUserSession(session)
  }, [session])

  const value = {
    labSession,
    labInfo,
    userSession,
    setLabSession,
    setLabInfo,
    isInLabWorkspace
  }

  return (
    <LabSessionContext.Provider value={value}>
      {children}
    </LabSessionContext.Provider>
  )
}

export function useLabSession() {
  const context = useContext(LabSessionContext)
  if (!context) {
    throw new Error('useLabSession must be used within a LabSessionProvider')
  }
  return context
}
