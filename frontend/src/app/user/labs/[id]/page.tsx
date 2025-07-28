"use client"

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lab Details | EzShell',
  description: 'View details, enroll, and complete hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
  openGraph: {
    title: 'Lab Details | EzShell',
    description: 'View details, enroll, and complete hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
    url: 'https://ezshelllabs.com/user/labs/[id]',
    siteName: 'EzShell',
    images: [
      {
        url: 'https://emucanze.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EzShell Open Graph Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lab Details | EzShell',
    description: 'View details, enroll, and complete hands-on cloud labs for Linux, OpenShift, and DevOps. Real infrastructure. Real learning.',
    site: '@ezshelllabs',
    creator: '@edilsonmucanze',
    images: ['https://emucanze.com/og-image.png'],
  },
};
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lab } from '@/types/labs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { LabsEmptyPlaceholder } from '../components/labs-empty-placeholder'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LabTasksOverview } from '@/components/lab-tasks-overview'
import { LabProvisioningDialog } from '@/components/lab-provisioning-dialog'
import EnrollmentStatus from '@/components/enrollment-status'

export default function LabDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [lab, setLab] = useState<Lab | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [showProvisioningDialog, setShowProvisioningDialog] = useState(false)

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

  useEffect(() => {
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
    setShowProvisioningDialog(true)
  }

  const handleProvisioningComplete = (enrollmentId: string) => {
    // Update lab state to show as enrolled
    setLab(prev => prev ? { ...prev, isEnrolled: true } : null)

    // Close dialog and redirect to lab
    setShowProvisioningDialog(false)
    toast.success('Lab environment is ready!')
    fetchLabDetails() // Refresh lab details to get updated enrollment
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">

        {/* Enrollment Status */}
        {lab.enrollment && (
          <EnrollmentStatus labId={lab.id} enrollment={{
            id: lab.enrollment.id,
            status: lab.enrollment.status,
            progress: lab.enrollment.progress,
            enrolledAt: lab.enrollment.enrolledAt
          }} />
        )}
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
        <div className="w-full">
          <Tabs defaultValue="details" className="">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="labTasks">Lab Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <div className="prose prose-invert max-w-none bg-muted/40 rounded-lg p-6 mb-8">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, style, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) {
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
            </TabsContent>
            <TabsContent value="labTasks">
              <LabTasksOverview labId={lab.id} />
            </TabsContent>
          </Tabs>
        </div>

        {!lab.isEnrolled &&(
          <Button
            size="lg"
            className="mt-4"
            disabled={isEnrolling}
            onClick={() => handleEnrollment(lab.id)}
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll in Lab'}
          </Button>
        )}

        {/* Lab Provisioning Dialog */}
        {
          !lab.enrollment && (
            <LabProvisioningDialog
              isOpen={showProvisioningDialog}
              onClose={() => setShowProvisioningDialog(false)}
              callbackIsEnrolling={setIsEnrolling}
              labId={lab.id}
              labName={lab.name}
              onProvisioningComplete={handleProvisioningComplete}
            />
          )
        }
      </div>
    </div>
  )
}
