'use client'

import { Separator } from "@radix-ui/react-separator";
import { LabsEmptyPlaceholder } from "./components/labs-empty-placeholder";
import { Lab } from "@/types/labs";
import { useState } from "react";
import { enrollInLab, getUserLabSessions } from "@/services/labs.service";
import { toast } from "sonner";
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AvailableLabsComponent } from "./components/available-labs";

export default function UserLabs() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [availableLabs, setAvailableLabs] = useState<Lab[]>([])
  const [isEnrolling, setIsEnrolling] = useState(false)

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

  const fetchAvailableLabs = async () => {
    try {
      const response = await fetch('/api/labs/available')
      if (!response.ok) throw new Error('Failed to fetch labs')
      const data = await response.json()
      setAvailableLabs(data)
    } catch (error) {
      console.log(error)
      toast.error('Failed to load available labs')
    }
  }

  const handleEnrollment = async (labId: string) => {
    try {
      setIsEnrolling(true)
      // const enrolledLab = await enrollInLab(labId)
      // setLabs(prevLabs =>
      //   prevLabs.map(lab =>
      //     lab.id === labId
      //       ? { ...lab, isEnrolled: true, progress: { completed: 0, total: 100 } }
      //       : lab
      //   )
      // )
      toast.success('Successfully enrolled in lab')
    } catch (error) {
      toast.error('Failed to enroll in lab')
    } finally {
      setIsEnrolling(false)
    }
  }

  React.useEffect(() => {
    handleLoadingLabs()
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
        <Dialog>
          <DialogTrigger asChild>
            <Button>Enroll in Lab</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Available Labs</DialogTitle>
              <DialogDescription>
                Select a lab to enroll in
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {availableLabs.map((lab) => (
                <Button
                  key={lab.id}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={isEnrolling}
                  onClick={() => handleEnrollment(lab.id)}
                >
                  {lab.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
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
          onEnroll={handleEnrollment}
          isEnrolling={isEnrolling}
        />
      )}
      {!isLoading && availableLabs.length === 0 && (
        <LabsEmptyPlaceholder />
      )}
    </div>
  )
}
