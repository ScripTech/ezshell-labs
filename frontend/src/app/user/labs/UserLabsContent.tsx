'use client'

import { Separator } from "@radix-ui/react-separator";
import { LabsEmptyPlaceholder } from "./components/labs-empty-placeholder";
import { Lab } from "@/types/labs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { AvailableLabsComponent } from "./components/available-labs";

function UserLabsContent() {
  const params = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [availableLabs, setAvailableLabs] = useState<Lab[]>([])
  const [isEnrolled, setIsEnrolled] = useState(params.get("q") === 'enrolled')

  const fetchAvailableLabs = async () => {
    try {
      const response = await fetch('/api/labs/available')
      if (!response.ok) throw new Error('Failed to fetch labs')
      const data = await response.json()
      setAvailableLabs(data || [])
    } catch (error) {
      console.error('Error fetching labs:', error)
      toast.error('Failed to fetch available labs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableLabs()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Labs</h1>
          <p className="text-muted-foreground">
            Browse and enroll in available hands-on labs
          </p>
        </div>
        <Separator className="mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-none rounded-md">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Labs</h1>
        <p className="text-muted-foreground">
          Browse and enroll in available hands-on labs
        </p>
      </div>
      <Separator className="mb-6" />

      {availableLabs.length === 0 ? (
        <LabsEmptyPlaceholder />
      ) : (
          <AvailableLabsComponent
            data={availableLabs}
          />
      )}
    </div>
  )
}

export { UserLabsContent };
