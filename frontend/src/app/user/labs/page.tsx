'use client'

import { Separator } from "@radix-ui/react-separator"
import { LabsEmptyPlaceholder } from "./components/labs-empty-placeholder"
import { UserLabs } from "./components/user-labs"
import { useEffect, useState } from "react"
import { LabSession } from "@/types/labs"
import { getUserLabSessions } from "@/services/labs.service"
import { toast } from "sonner"

export default function Dashboard() {
  const [labs, setLabs] = useState<LabSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingLabs = async () => {
    try {
      const labSessions = await getUserLabSessions()
      setLabs(labSessions)
    } catch (error) {
      toast.error('Failed to load lab sessions')
      console.error('Error loading labs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleLoadingLabs()
  }, [])

  return (
    <div className="h-full flex-col border-none p-0 data-[state=active]:flex">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Auza playground Labs
          </h2>
          <p className="text-sm text-muted-foreground">
            Your favorite shell lab playground.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
        </div>
      ) : labs.length > 0 ? (
        <UserLabs labs={labs} />
      ) : (
        <LabsEmptyPlaceholder />
      )}
    </div>
  )
}
