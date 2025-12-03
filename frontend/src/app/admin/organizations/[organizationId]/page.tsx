'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Building,
  Mail,
  Globe,
  Users,
  Calendar,
  Settings,
  ArrowLeft,
  Edit,
  UserPlus,
  Clock,
  MapPin,
  DollarSign,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  website: string | null
  logo: string | null
  industry: string | null
  size: string | null
  country: string | null
  timezone: string | null
  plan: string
  maxUsers: number
  billingEmail: string | null
  isActive: boolean
  isVerified: boolean
  settings: any
  createdAt: string
  updatedAt: string
  memberCount: number
  members: Member[]
}

interface Member {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: Date | null
  createdAt: string
}

interface OrganizationDetailsPageProps {
  params: {
    organizationId: string
  }
}

export default function OrganizationDetailsPage({ params }: OrganizationDetailsPageProps) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchOrganization()
  }, [params.organizationId])

  const fetchOrganization = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/organizations/${params.organizationId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch organization: ${response.status}`)
      }

      const data = await response.json()
      setOrganization(data)
    } catch (error) {
      console.error('Error fetching organization:', error)
      setError('Failed to load organization details')
      toast.error('Failed to load organization details')
    } finally {
      setLoading(false)
    }
  }

  const getPlanBadge = (plan: string) => {
    const variants = {
      free: 'secondary',
      basic: 'outline',
      pro: 'default',
      enterprise: 'destructive',
    }
    return <Badge variant={variants[plan as keyof typeof variants] as any}>{plan}</Badge>
  }

  const getSizeBadge = (size: string | null) => {
    if (!size) return null
    const colors = {
      startup: 'bg-green-100 text-green-800',
      small: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      large: 'bg-orange-100 text-orange-800',
      enterprise: 'bg-purple-100 text-purple-800',
    }
    return (
      <Badge variant="outline" className={colors[size as keyof typeof colors]}>
        {size}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      manager: 'default',
      user: 'secondary',
      clientUser: 'outline',
    }
    return (
      <Badge variant={variants[role as keyof typeof variants] as any}>
        {role}
      </Badge>
    )
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading organization details...</p>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md shadow-none rounded-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || 'Organization not found'}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Organizations
        </Button>
      </div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-muted-foreground">@{organization.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/organizations/${organization.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Organization
            </Link>
          </Button>
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
        <Card className="lg:col-span-1 shadow-none rounded-md">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={organization.logo || ''} alt={organization.name} />
              <AvatarFallback className="text-lg">
                {getInitials(organization.name, organization.slug)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">
              {organization.name}
            </CardTitle>
            <CardDescription className="text-sm">
              @{organization.slug}
            </CardDescription>
            <div className="flex justify-center gap-2 mt-2">
              {getPlanBadge(organization.plan)}
              {organization.size && getSizeBadge(organization.size)}
              {!organization.isActive && (
                <Badge variant="destructive">Inactive</Badge>
              )}
              {organization.isVerified && (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization.description && (
              <p className="text-sm text-muted-foreground">
                {organization.description}
              </p>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Members</p>
                  <p className="text-xs text-muted-foreground">
                    {organization.memberCount} / {organization.maxUsers}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(organization.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(organization.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className='shadow-none rounded-md'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organization Name</p>
                  <p className="text-base">{organization.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slug</p>
                  <p className="text-base font-mono">@{organization.slug}</p>
                </div>
                {organization.industry && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <p className="text-base capitalize">{organization.industry}</p>
                  </div>
                )}
                {organization.country && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Country</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <p className="text-base">{organization.country}</p>
                    </div>
                  </div>
                )}
                {organization.website && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {organization.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {organization.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-base">{organization.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription & Billing */}
          <Card className='shadow-none rounded-md'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Subscription & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <div className="flex items-center gap-2">
                    {getPlanBadge(organization.plan)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Users</p>
                  <p className="text-base">{organization.maxUsers}</p>
                </div>
                {organization.billingEmail && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Billing Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <p className="text-base">{organization.billingEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card className='shadow-none rounded-md'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({organization.memberCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organization.members.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No members found in this organization.
                </p>
              ) : (
                <div className="space-y-3">
                  {organization.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(member.name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name || member.email}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {formatDate(member.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(member.role)}
                        {member.emailVerified && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          {organization.settings && Object.keys(organization.settings).length > 0 && (
            <Card className='shadow-none rounded-md'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Organization Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organization.settings.allowSelfRegistration !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Self Registration</p>
                      <Badge variant={organization.settings.allowSelfRegistration ? "default" : "secondary"}>
                        {organization.settings.allowSelfRegistration ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  )}
                  {organization.settings.defaultUserRole && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Default User Role</p>
                      <Badge variant="outline">{organization.settings.defaultUserRole}</Badge>
                    </div>
                  )}
                  {organization.settings.requireEmailVerification !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Verification Required</p>
                      <Badge variant={organization.settings.requireEmailVerification ? "default" : "secondary"}>
                        {organization.settings.requireEmailVerification ? "Required" : "Optional"}
                      </Badge>
                    </div>
                  )}
                  {organization.settings.labRetentionDays && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lab Retention</p>
                      <p className="text-base">{organization.settings.labRetentionDays} days</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
