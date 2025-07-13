'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lab } from '@/types/labs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { LabsEmptyPlaceholder } from '../components/labs-empty-placeholder'
import { ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function LabDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [lab, setLab] = useState<Lab | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)

  useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        const response = await fetch(`/api/labs/${ params.id }`)
        if (!response.ok) throw new Error('Failed to fetch lab details')
        const data = await response.json()
        data.isEnrolled = data.enrollment?.status === 'enrolled'
        setLab(data)
      } catch (error) {
        toast.error('Failed to load lab details')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLabDetails()
  }, [params.id, router])


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
      const response = await fetch('/api/labs/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ labId }),
      })

      if (!response.ok) {
        throw new Error('Failed to enroll in lab')
      }

      // const data = await response.json()
      setLab(prev => prev ? { ...prev, isEnrolled: true } : null)
      toast.success('Successfully enrolled in lab')
      router.push(`/ezshell?lab=${labId}&question=question-1-network-config`)
    } catch (error) {
      console.error('Enrollment error:', error)
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
        <div className="prose prose-invert max-w-none bg-muted/40 rounded-lg p-6 mb-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children, style, ...props}: React.ComponentProps<'code'> & {inline?: boolean}) {
                const match = /language-(\w+)/.exec(className || "")
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} style={style} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {lab.description}
          </ReactMarkdown>
        </div>

        {lab.isEnrolled ? (
          <Button
            size="lg"
            className="mt-8"
            onClick={() => router.push(`/ezshell?lab=${ lab.id }&question=question-1-network-config`)}
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
