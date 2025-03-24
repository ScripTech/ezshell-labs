'use client'

import { Separator } from "@radix-ui/react-separator";
import { LabsEmptyPlaceholder } from "./components/labs-empty-placeholder";
import { Lab } from "@/types/labs";
import { useState } from "react";
import { getUserLabSessions } from "@/services/labs.service";
import { toast } from "sonner";
import React from "react";
import { AvailableLabsComponent } from "./components/available-labs";

export default function UserLabs() {
  const [isLoading, setIsLoading] = useState(true)
  const [availableLabs, setAvailableLabs] = useState<Lab[]>([])
  const [isEnrolling, setIsEnrolling] = useState(false)

  const fetchAvailableLabs = async () => {
    try {
      const response = await fetch('/api/labs/available')
      if (!response.ok) throw new Error('Failed to fetch labs')
      const data = await response.json()
      setAvailableLabs(data)
    } catch (error) {
      console.log(error)
      toast.error('Failed to load available labs')
    }finally{
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAvailableLabs()
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
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
        </div>
      )}
      {!isLoading && (
        <AvailableLabsComponent
          data={availableLabs}
        />
      )}
      {!isLoading && availableLabs.length === 0 && (
        <LabsEmptyPlaceholder />
      )}
    </div>
  )
}
