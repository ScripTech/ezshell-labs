'use client'

import { Separator } from "@radix-ui/react-separator";
import { LabsEmptyPlaceholder } from "./components/labs-empty-placeholder";
import { Lab } from "@/types/labs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AvailableLabsComponent } from "./components/available-labs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";

export default function UserLabs() {

  const params = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [availableLabs, setAvailableLabs] = useState<Lab[]>([])
  const [isEnrolled, setIsEnrolled] = useState(params.get("q") === 'enrolled')

  const fetchAvailableLabs = async () => {
    try {
      const response = await fetch('/api/labs/available')
      if (!response.ok) throw new Error('Failed to fetch labs')
      const data = await response.json()
      if (isEnrolled) {
        setAvailableLabs(data.filter((lab: Lab) => lab.isEnrolled))
      } else {
        setAvailableLabs(data)
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to load available labs')
    }finally{
      setIsLoading(false)
    }
  }

  useEffect(() => {
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
        <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="p-4">
                <Skeleton className="h-52 object-cover transition-transform group-hover:scale-105" />
              </CardHeader>
              <CardContent className="px-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-5 w-3/2 mb-2" />
                <Skeleton className="h-5 w-3/2" />
              </CardContent>
            </Card>
          ))}
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
