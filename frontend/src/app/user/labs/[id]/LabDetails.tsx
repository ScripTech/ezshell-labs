"use client"

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lab } from '@/types/labs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import Image from 'next/image'
import { LabsEmptyPlaceholder } from '../components/labs-empty-placeholder'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LabTasksOverview } from '@/components/lab-tasks-overview'
import { LabProvisioningDialog } from '@/components/lab-provisioning-dialog'
import EnrollmentStatus from '@/components/enrollment-status'
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Award,
  PlayCircle,
  CheckCircle,
  Globe,
  Calendar,
  TrendingUp,
  Terminal,
  Server,
  Code,
  FileText
} from 'lucide-react'
import { sendGAEvent } from '@next/third-parties/google'

export function LabDetails() {
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

    const handleAccessLab = (lab: Lab) => {
      if (lab.enrollment?.id) {
        sendGAEvent('lab_enrollment', 'access_lab', lab.id, "enrollmentId", lab.enrollment.id);
        window.open(`/ezshell/${ lab.id }?enrollment=${ lab.enrollment.id }`, '_blank')
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

  // Mock data for demo - in real app this would come from API
  const labStats = {
    rating: 4.8,
    reviewCount: 247,
    enrolledCount: lab?.enrolledCount || 392,
    completionRate: 87
  }

  // Use instructor from API or fallback to default
  const instructor = lab?.instructor || {
    name: "Edilson D. Mucanze",
    title: "Senior DevOps Engineer & Cloud Solutions Architect",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQFGJ30dWLkozA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729767497020?e=1757548800&v=beta&t=4CZ2Ihxgnrtl1wsRfDtdafhqiQzL8e-YeSYmykxzSrA",
    experience: "8+ years",
    bio: "Edilson is an experienced DevOps engineer and cloud solutions architect with expertise in AWS, Linux systems, and containerization technologies. He has led multiple cloud migration projects and specializes in building scalable, secure infrastructure solutions for enterprise environments."
  }

  const labFeatures = [
    { icon: Terminal, label: "Hands-on Terminal", description: "Real Linux environment" },
    { icon: Server, label: "Cloud Infrastructure", description: "AWS EC2 instances" },
    { icon: Code, label: "Interactive Tasks", description: "Step-by-step exercises" },
    { icon: Award, label: "Real-time validation", description: "Instant task validation and points" }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="rounded-md relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-white/80 text-sm">
                <span>Lab</span>
                <span>/</span>
                <span className="text-white">{lab.name}</span>
              </div>

              {/* Lab Title & Tags */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {lab.instructor?.specializations?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {lab?.name || "Red Hat Certified System Administrator(RHCSA)"}
                </h1>

                {/* Rating & Stats */}
                <div className="flex flex-wrap items-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(labStats.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'}`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{labStats.rating}</span>
                    <span className="text-white/80">({labStats.reviewCount.toLocaleString()} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-5 h-5" />
                    <span>{labStats.enrolledCount.toLocaleString()} students</span>
                  </div>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={instructor.avatar} alt={instructor.name} />
                    <AvatarFallback>EM</AvatarFallback>
                  </Avatar>
                  <div className="text-white">
                    <div className="font-semibold">{instructor.name}</div>
                    <div className="text-sm text-white/80">{instructor.title}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Lab Preview Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <CardContent className="p-0">
                  <div className="aspect-video relative rounded-t-lg overflow-hidden">
                    <Image
                      src={lab?.imageUrl ?? '/images/default-lab.jpg'}
                      alt={lab?.name || "Lab Preview"}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-white hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Lab Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium dark:text-black">{lab?.duration || 120} minutes</div>
                          <div className="text-muted-foreground">Duration</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium dark:text-black">{lab?.progress?.total || 15}+ tasks</div>
                          <div className="text-muted-foreground">Exercises</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium dark:text-black">English</div>
                          <div className="text-muted-foreground">Language</div>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment Progress */}
                    {lab?.enrollment && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{lab.enrollment.progress}%</span>
                        </div>
                        <Progress value={lab.enrollment.progress} className="h-2" />
                      </div>
                    )}

                    {/* CTA Button */}
                    {!lab?.isEnrolled ? (
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={isEnrolling}
                        onClick={() => handleEnrollment(lab?.id || '')}
                      >
                        {isEnrolling ? 'Enrolling...' : 'Start Lab Now'}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="w-full"
                        variant="default"
                        onClick={() => handleAccessLab(lab)}
                        >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Continue Lab
                      </Button>
                    )}

                    {/* Additional Info */}
                    <div className="text-center text-sm text-muted-foreground">
                      Access to 15+ hands on tasks playground.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Enrollment Status */}
          {lab?.enrollment && (
            <div className="mb-8">
              <EnrollmentStatus labId={lab.id} enrollment={{
                id: lab.enrollment.id,
                status: lab.enrollment.status,
                progress: lab.enrollment.progress,
                enrolledAt: lab.enrollment.enrolledAt
              }} />
            </div>
          )}

          {/* What You'll Learn Section */}
          <Card className="mb-8 shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                What you'll learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>RHCSA Certification Mock Exam</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Manage users and groups</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Manage file permissions and ownership</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Configure networking and network services</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Install and manage software packages</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Manage storage using LVM and file systems</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Troubleshoot common system issues</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Manage system processes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {labFeatures.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow shadow-none rounded-md">
                <CardContent className="pt-6">
                  <feature.icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">{feature.label}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Curriculum
              </TabsTrigger>
              <TabsTrigger value="instructor" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Instructor
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className='rounded-md shadow-none'>
                <CardHeader>
                  <CardTitle>Course Overview</CardTitle>
                  <CardDescription>
                    Master {lab.name} with hands-on practice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
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
                      {lab?.description}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum">
              <Card>
                <CardHeader>
                  <CardTitle>Lab Tasks & Exercises</CardTitle>
                  <CardDescription>
                    {lab?.progress?.total || 15} hands-on exercises to master RHCSA skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LabTasksOverview labId={lab?.id || ''} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instructor">
              <Card>
                <CardHeader>
                  <CardTitle>Meet Your Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <Avatar className="w-32 h-32">
                        <AvatarImage src={lab.instructor?.avatar} alt={lab.instructor?.name} />
                        <AvatarFallback className="text-2xl">{lab.instructor?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold">{lab.instructor?.name}</h3>
                        <p className="text-lg text-muted-foreground">{lab.instructor?.title}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-semibold">Experience</div>
                          <div className="text-muted-foreground">{lab.instructor?.experience}</div>
                        </div>
                        <div>
                          <div className="font-semibold">Students</div>
                          <div className="text-muted-foreground">{7}+</div>
                          {/* <div className="text-muted-foreground">{lab.instructor?.students || 7}+</div> */}
                        </div>
                        <div>
                          <div className="font-semibold">Courses</div>
                          <div className="text-muted-foreground">25</div>
                        </div>
                        <div>
                          <div className="font-semibold">Rating</div>
                          <div className="text-muted-foreground">4.8 ⭐</div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        {instructor.bio}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Student Reviews</CardTitle>
                  <CardDescription>
                    See what other students are saying about this lab
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Review Summary */}
                    <div className="flex items-center gap-6 p-6 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{labStats.rating}</div>
                        <div className="flex justify-center mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(labStats.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">Course Rating</div>
                      </div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-2">
                              <div className="flex items-center gap-1 w-12">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{rating}</span>
                              </div>
                              <Progress
                                value={rating === 5 ? 75 : rating === 4 ? 20 : 5}
                                className="flex-1 h-2"
                              />
                              <span className="text-sm text-muted-foreground w-12">
                                {rating === 5 ? '75%' : rating === 4 ? '20%' : '5%'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-4">
                      {[
                        { name: "Sarah Chen", rating: 5, date: "2 weeks ago", comment: "Excellent hands-on practice! The lab environment is very realistic and the exercises are perfectly structured." },
                        { name: "Mike Rodriguez", rating: 5, date: "1 month ago", comment: "This lab helped me pass my RHCSA exam on the first try. The tasks are challenging but well-explained." },
                        { name: "Jennifer Kim", rating: 4, date: "2 months ago", comment: "Great content overall. Would love to see more advanced troubleshooting scenarios." }
                      ].map((review, index) => (
                        <div key={index} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>{review.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{review.name}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              <p className="text-muted-foreground">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lab Provisioning Dialog */}
      {!lab?.enrollment && (
        <LabProvisioningDialog
          isOpen={showProvisioningDialog}
          onClose={() => setShowProvisioningDialog(false)}
          callbackIsEnrolling={setIsEnrolling}
          labId={lab?.id || ''}
          labName={lab?.name || ''}
          enrollId={lab?.enrollment?.id || null}
          onProvisioningComplete={handleProvisioningComplete}
        />
      )}
    </div>
  )
}
