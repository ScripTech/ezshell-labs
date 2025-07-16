'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Terminal } from "lucide-react"
import { formatDistanceToNow, format } from 'date-fns'
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface LabHistory {
  id: string
  labName: string
  startTime: Date
  endTime: Date
  status: 'completed' | 'in_progress' | 'expired'
  progress: number
  duration: number
}

export default function HistoryPage() {
  const [history, setHistory] = useState<LabHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/labs/history')
        if (!response.ok) throw new Error('Failed to fetch history')
        const data = await response.json()
        setHistory(data)
      } catch (error) {
        toast.error('Failed to load lab history')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Lab History</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Lab History</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {history.map((session) => (
          <Card key={session.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {session.labName}
              </CardTitle>
              <Badge
                variant={
                  "completed" === session.status
                    ? "outline"
                    : "in_progress" === session.status
                    ? "secondary"
                    : "default"
                }
              >
                {session.status.replace('_', ' ')}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Started {formatDistanceToNow(new Date(session.startTime))} ago
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Duration: {session.duration} minutes
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Terminal className="mr-2 h-4 w-4" />
                  Progress: {session.progress}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Terminal className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Lab History</h3>
          <p className="text-sm text-muted-foreground">
            You haven&apos;t completed any labs yet. Start a lab to see your history.
          </p>
        </div>
      )}
    </div>
  )
}
