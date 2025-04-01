'use client'

import { Lab } from "@/types/labs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Terminal, Users, CheckCircle2, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface AvailableLabsProps {
  data: Lab[]
  onContinue?: (labId: string) => void
}

export function AvailableLabsComponent({
  data,
  onContinue,
}: Readonly<AvailableLabsProps>) {
  const router = useRouter()

  const handleLabDetails = (labId: string) => {
    router.push(`/user/labs/${labId}`)
  }

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
          </CardContent>
          <CardFooter className="p-4 pt-0">
            {lab.isEnrolled ? (
              <Button
                className="w-full"
                onClick={() => handleLabDetails(lab.id)}
              >
                View Lab
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleLabDetails(lab.id)}
              >
                Enroll to Lab
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
