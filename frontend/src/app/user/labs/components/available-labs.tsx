'use client'

import { Lab } from "@/types/labs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Terminal, Users } from "lucide-react"
import Image from "next/image"

interface AvailableLabsProps {
  data: Lab[]
  onEnroll: (labId: string) => void
  isEnrolling: boolean
}

export function AvailableLabsComponent({ data, onEnroll, isEnrolling }: AvailableLabsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((lab) => (
        <Card key={lab.id} className="group hover:shadow-lg transition-shadow">
          <CardHeader className="border-b p-0">
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <Image
                src={lab.imageUrl || '/images/default-lab.jpg'}
                alt={lab.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                priority
              />
              <div className="absolute top-2 right-2">
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
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                <span>1 User</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              className="w-full"
              onClick={() => onEnroll(lab.id)}
              disabled={isEnrolling}
            >
              Start Lab
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
