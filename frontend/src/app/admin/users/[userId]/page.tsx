'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  Mail,
  Shield,
  Calendar,
  Building,
  ArrowLeft,
  Edit,
  UserCheck,
  Clock,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'manager' | 'user' | 'clientUser'
  emailVerified: Date | null
  image: string | null
  organizationId: string | null
  createdAt: Date
  updatedAt: Date
  organization?: {
    id: string
    name: string
    website: string
    plan: string
  }
}

interface UserDetailsPageProps {
  params: {
    userId: string
  }
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [params.userId])

  const fetchUser = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${params.userId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`)
      }

      const data = await response.json()
      setUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Failed to load user details')
      toast.error('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      manager: 'default',
      user: 'secondary',
      clientUser: 'outline',
    }

    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
      clientUser: 'bg-green-100 text-green-800',
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
          <p>Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || 'User not found'}</p>
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-muted-foreground">View and manage user information</p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit User
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
              <AvatarFallback className="text-lg">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">
              {user.name || 'No Name'}
            </CardTitle>
            <CardDescription className="text-sm">
              {user.email}
            </CardDescription>
            <div className="flex justify-center mt-2">
              {getRoleBadge(user.role)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {user.emailVerified ? 'Email Verified' : 'Email Not Verified'}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base">{user.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                  <p className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {getRoleBadge(user.role)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-xs font-mono">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Information */}
          {user.organization ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Organization Name</p>
                    <p className="text-base">{user.organization.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <p className="text-base">{user.organization.website}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <Badge variant="outline">{user.organization.plan}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
                    <p className="text-xs font-mono">{user.organization.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">This user is not associated with any organization.</p>
              </CardContent>
            </Card>
          )}

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email Verification</p>
                  <div className="flex items-center gap-2">
                    {user.emailVerified ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Not Verified
                      </Badge>
                    )}
                    {user.emailVerified && (
                      <span className="text-xs text-muted-foreground">
                        on {formatDate(user.emailVerified)}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profile Image</p>
                  <p className="text-base">{user.image ? 'Set' : 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
