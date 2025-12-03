'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Building,
  Plus,
  Search,
  Users,
  Globe,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import CreateForm, { FormField } from '@/components/shared/CreateForm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  plan: string
  maxUsers: number
  isActive: boolean
  createdAt: string
  memberCount?: number
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/organizations')
      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status}`)
      }
      const data = await response.json()
      setOrganizations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
      toast.error('Failed to load organizations')
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async (data: Record<string, any>) => {
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create organization',
          details: result.details,
        }
      }

      fetchOrganizations() // Refresh list
      return { success: true }

    } catch (error) {
      console.error('Error creating organization:', error)
      return {
        success: false,
        error: 'Failed to create organization',
      }
    }
  }

  const handleDeleteOrganization = async () => {
    if (!organizationToDelete) return

    try {
      const response = await fetch(`/api/admin/organizations/${organizationToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete organization')
      }

      toast.success('Organization deleted successfully')
      fetchOrganizations() // Refresh list
      setDeleteDialogOpen(false)
      setOrganizationToDelete(null)

    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization')
    }
  }

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.country?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Define form fields for creating organizations
  const organizationFormFields: FormField[] = [
    {
      name: 'name',
      label: 'Organization Name',
      type: 'text',
      placeholder: 'Enter organization name',
      required: true,
      grid: 'half',
    },
    {
      name: 'slug',
      label: 'Slug (URL identifier)',
      type: 'text',
      placeholder: 'organization-slug',
      required: true,
      grid: 'half',
      validation: (value: string) => {
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Slug must contain only lowercase letters, numbers, and hyphens'
        }
        return null
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Brief description of the organization',
      grid: 'full',
    },
    {
      name: 'website',
      label: 'Website',
      type: 'text',
      placeholder: 'https://example.com',
      grid: 'half',
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'select',
      grid: 'half',
      options: [
        { value: 'technology', label: 'Technology' },
        { value: 'finance', label: 'Finance' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'retail', label: 'Retail' },
        { value: 'consulting', label: 'Consulting' },
        { value: 'government', label: 'Government' },
        { value: 'nonprofit', label: 'Non-profit' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      name: 'size',
      label: 'Organization Size',
      type: 'select',
      grid: 'half',
      options: [
        { value: 'startup', label: 'Startup (1-10 employees)' },
        { value: 'small', label: 'Small (11-50 employees)' },
        { value: 'medium', label: 'Medium (51-200 employees)' },
        { value: 'large', label: 'Large (201-1000 employees)' },
        { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
      ],
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'United States',
      grid: 'half',
    },
    {
      name: 'plan',
      label: 'Subscription Plan',
      type: 'select',
      required: true,
      grid: 'half',
      options: [
        { value: 'free', label: 'Free' },
        { value: 'basic', label: 'Basic' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
      ],
    },
    {
      name: 'maxUsers',
      label: 'Maximum Users',
      type: 'number',
      placeholder: '10',
      required: true,
      grid: 'half',
    },
  ]

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage organizations and their settings</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <CreateForm
        title="Create New Organization"
        description="Add a new organization to the system"
        fields={organizationFormFields}
        onSubmit={handleCreateOrganization}
        onCancel={() => setShowCreateForm(false)}
        submitLabel="Create Organization"
        isVisible={showCreateForm}
      />

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="h-64 shadow-none rounded-md">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredOrganizations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No organizations found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No organizations match your search.' : 'Get started by creating your first organization.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            )}
          </div>
        ) : (
          filteredOrganizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow shadow-none rounded-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{org.name}</CardTitle>
                  <CardDescription className="text-sm">@{org.slug}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/organizations/${org.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/organizations/${org.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        setOrganizationToDelete(org)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {org.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {getPlanBadge(org.plan)}
                  {org.size && getSizeBadge(org.size)}
                  {!org.isActive && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {org.industry && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{org.industry}</span>
                    </div>
                  )}

                  {org.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {org.website}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{org.memberCount || 0} / {org.maxUsers} users</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{organizationToDelete?.name}"? This action cannot be undone.
              All users and data associated with this organization will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrganization}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
