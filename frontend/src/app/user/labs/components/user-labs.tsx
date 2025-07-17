'use client'

import { LabSession } from '@/types/labs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'

interface UserLabsProps {
  labs: LabSession[]
}

export function UserLabsComponent({ labs }: UserLabsProps) {
  console.log('Rendering UserLabs with labs:', labs)
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {labs.map((lab) => (
        <Card key={lab.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Lab Session</CardTitle>
              <Badge
                variant={lab.isActive ? "default" : "secondary"}
              >
                {lab.status || (lab.isActive ? 'Active' : 'Expired')}
              </Badge>
            </div>
            <CardDescription>
              Started {formatDistanceToNow(new Date(lab.startTime))} ago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Expires in {formatDistanceToNow(new Date(lab.endTime))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
