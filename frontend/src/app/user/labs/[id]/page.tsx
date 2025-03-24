'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lab } from '@/types/labs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { LabsEmptyPlaceholder } from '../components/labs-empty-placeholder'
import { ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function LabDetailsPage() {
  const params = useParams()
  const [lab, setLab] = useState<Lab | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)

  useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        const response = await fetch(`/api/labs/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch lab details')
        const data = await response.json()
        setLab(data)
      } catch (error) {
        toast.error('Failed to load lab details')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLabDetails()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video relative mb-8 rounded-lg overflow-hidden">
              <Skeleton className="h-6 w-64 mb-4" />
              <Skeleton className="h-full mb-2" />
          </div>
          <div className="prose max-w-none">
            <Skeleton className="h-4 mb-4" />
            <Skeleton className="h-4 mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
          </div>
        </div>
      </div>
    )
  }

  if (!lab) {
    return (
      <LabsEmptyPlaceholder
        title="Lab Not Found"
        description="The lab you're looking for doesn't exist or you don't have access to it."
        action={
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        }
      />
    )
  }


    const handleEnrollment = async (labId: string) => {
      try {
        setIsEnrolling(true)

        toast.success('Successfully enrolled in lab')
      } catch (error) {
        toast.error('Failed to enroll in lab')
      } finally {
        setIsEnrolling(false)
      }
    }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{lab.name}</h1>
        <div className="aspect-video relative mb-8 rounded-lg overflow-hidden">
          <Image
            src={lab.imageUrl ?? '/images/default-lab.jpg'}
            alt={lab.name}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="prose max-w-none">
          <p className="text-lg mb-4 text-white">{lab.description}</p>
          {/* Add more lab details here */}
        </div>
        {lab.isEnrolled ? (
          <Button
            size="lg"
            className="mt-8"
            onClick={() => {}}
          >
            Continue Lab
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="mt-8"
            disabled={isEnrolling}
            onClick={() => handleEnrollment(lab.id)}
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll in Lab'}
          </Button>
        )}
      </div>
    </div>
  )
}
