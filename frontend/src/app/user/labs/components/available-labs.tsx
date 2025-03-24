'use client'

import { Lab } from "@/types/labs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Terminal, Users, CheckCircle2, ArrowRight } from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"

interface AvailableLabsProps {
  data: Lab[]
  onEnroll: (labId: string) => void
  onContinue?: (labId: string) => void
  isEnrolling: boolean
}

export function AvailableLabsComponent({
  data,
  onEnroll,
  onContinue,
  isEnrolling
}: Readonly<AvailableLabsProps>) {

  console.log(data)

  return (
    <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {data.map((lab) => (
        <Card key={lab.id} className="group hover:shadow-lg transition-shadow">
          <CardHeader className="border-b p-0">
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <Image
                src={lab.imageUrl ?? '/images/default-lab.jpg'}
                alt={lab.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                priority
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {lab.isEnrolled && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Enrolled
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-black/60 text-white">
                  {lab.duration} min
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">
              {lab.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {lab.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{lab.duration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Terminal className="h-4 w-4" />
                <span>Shell Lab</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{lab.enrolledCount} Users</span>
              </div>
            </div>
            {lab.isEnrolled && lab.progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round((lab.progress.completed / lab.progress.total) * 100)}%</span>
                </div>
                <Progress
                  value={(lab.progress.completed / lab.progress.total) * 100}
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0">
            {lab.isEnrolled ? (
              <Button
                className="w-full"
                onClick={() => onContinue?.(lab.id)}
              >
                Continue Lab
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => onEnroll(lab.id)}
                disabled={isEnrolling}
              >
                Start Lab
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
