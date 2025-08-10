"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Instructor, CreateInstructorData } from '@/types/instructors'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Award,
  Mail,
  ExternalLink,
  Linkedin,
  Twitter,
  Github,
  Globe
} from 'lucide-react'

export default function InstructorsPage() {
  const router = useRouter()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [deletingInstructor, setDeletingInstructor] = useState<Instructor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateInstructorData>({
    name: '',
    title: '',
    bio: '',
    avatar: '',
    email: '',
    experience: '',
    specializations: [],
    socialLinks: {}
  })

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/admin/instructors')
      if (!response.ok) throw new Error('Failed to fetch instructors')
      const data = await response.json()
      setInstructors(data)
    } catch (error) {
      toast.error('Failed to load instructors')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstructors()
  }, [])

  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      bio: '',
      avatar: '',
      email: '',
      experience: '',
      specializations: [],
      socialLinks: {}
    })
    setEditingInstructor(null)
  }

  const handleCreateInstructor = async () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      toast.error('Name and title are required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create instructor')

      const newInstructor = await response.json()
      setInstructors(prev => [newInstructor, ...prev])
      setShowCreateDialog(false)
      resetForm()
      toast.success('Instructor created successfully')
    } catch (error) {
      toast.error('Failed to create instructor')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateInstructor = async () => {
    if (!editingInstructor || !formData.name.trim() || !formData.title.trim()) {
      toast.error('Name and title are required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/instructors/${editingInstructor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update instructor')

      const updatedInstructor = await response.json()
      setInstructors(prev =>
        prev.map(inst => inst.id === editingInstructor.id ? updatedInstructor : inst)
      )
      setEditingInstructor(null)
      resetForm()
      toast.success('Instructor updated successfully')
    } catch (error) {
      toast.error('Failed to update instructor')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteInstructor = async (instructorId: string) => {
    try {
      const response = await fetch(`/api/admin/instructors/${instructorId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete instructor')

      setInstructors(prev => prev.filter(inst => inst.id !== instructorId))
      toast.success('Instructor deleted successfully')
    } catch (error) {
      toast.error('Failed to delete instructor')
      console.error(error)
    }
  }

  const handleToggleActive = async (instructor: Instructor) => {
    try {
      const response = await fetch(`/api/admin/instructors/${instructor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !instructor.isActive })
      })

      if (!response.ok) throw new Error('Failed to update instructor status')

      const updatedInstructor = await response.json()
      setInstructors(prev =>
        prev.map(inst => inst.id === instructor.id ? updatedInstructor : inst)
      )
      toast.success(`Instructor ${updatedInstructor.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      toast.error('Failed to update instructor status')
      console.error(error)
    }
  }

  const openEditDialog = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setFormData({
      name: instructor.name,
      title: instructor.title,
      bio: instructor.bio || '',
      avatar: instructor.avatar || '',
      email: instructor.email || '',
      experience: instructor.experience || '',
      specializations: instructor.specializations || [],
      socialLinks: instructor.socialLinks || {}
    })
  }

  const handleSpecializationsChange = (value: string) => {
    const specializations = value.split(',').map(s => s.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, specializations }))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading instructors...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Instructor Management</h1>
          <p className="text-muted-foreground">Manage course instructors and their profiles</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Instructor</DialogTitle>
              <DialogDescription>
                Add a new instructor to the platform
              </DialogDescription>
            </DialogHeader>
            <InstructorForm
              formData={formData}
              setFormData={setFormData}
              onSpecializationsChange={handleSpecializationsChange}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInstructor} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Instructor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructors.length}</div>
          </CardContent>
        </Card>
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructors.filter(i => i.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Social Links</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructors.filter(i => i.socialLinks && Object.keys(i.socialLinks).length > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructors.filter(i => i.email).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search instructors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Instructors Table */}
      <Card className='shadow-none rounded-md'>
        <CardHeader>
          <CardTitle>Instructors</CardTitle>
          <CardDescription>
            Manage instructor profiles and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={instructor.avatar} alt={instructor.name} />
                        <AvatarFallback>
                          {instructor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{instructor.name}</div>
                        {instructor.email && (
                          <div className="text-sm text-muted-foreground">{instructor.email}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {instructor.socialLinks?.linkedin && (
                            <Linkedin className="w-3 h-3 text-blue-600" />
                          )}
                          {instructor.socialLinks?.twitter && (
                            <Twitter className="w-3 h-3 text-blue-400" />
                          )}
                          {instructor.socialLinks?.github && (
                            <Github className="w-3 h-3 text-gray-600" />
                          )}
                          {instructor.socialLinks?.website && (
                            <Globe className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{instructor.title}</div>
                  </TableCell>
                  <TableCell>{instructor.experience || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {instructor.specializations?.slice(0, 2).map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {instructor.specializations && instructor.specializations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{instructor.specializations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={instructor.isActive}
                        onCheckedChange={() => handleToggleActive(instructor)}
                      />
                      <Badge variant={instructor.isActive ? "default" : "secondary"}>
                        {instructor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(instructor)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Instructor</DialogTitle>
                            <DialogDescription>
                              Update instructor information
                            </DialogDescription>
                          </DialogHeader>
                          <InstructorForm
                            formData={formData}
                            setFormData={setFormData}
                            onSpecializationsChange={handleSpecializationsChange}
                          />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingInstructor(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateInstructor} disabled={isSubmitting}>
                              {isSubmitting ? 'Updating...' : 'Update Instructor'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={deletingInstructor?.id === instructor.id} onOpenChange={(open) => !open && setDeletingInstructor(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setDeletingInstructor(instructor)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Instructor</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete "{instructor.name}"? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingInstructor(null)}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                handleDeleteInstructor(instructor.id)
                                setDeletingInstructor(null)
                              }}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInstructors.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No instructors found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No instructors match your search.' : 'Get started by adding your first instructor.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Instructor
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Instructor Form Component
interface InstructorFormProps {
  formData: CreateInstructorData
  setFormData: React.Dispatch<React.SetStateAction<CreateInstructorData>>
  onSpecializationsChange: (value: string) => void
}

function InstructorForm({ formData, setFormData, onSpecializationsChange }: InstructorFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Senior DevOps Engineer"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experience">Experience</Label>
          <Input
            id="experience"
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
            placeholder="5+ years"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input
            id="avatar"
            value={formData.avatar}
            onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specializations">Specializations (comma-separated)</Label>
        <Input
          id="specializations"
          value={formData.specializations?.join(', ') || ''}
          onChange={(e) => onSpecializationsChange(e.target.value)}
          placeholder="DevOps, AWS, Docker, Kubernetes"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Brief biography and background..."
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <Label>Social Links</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={formData.socialLinks?.linkedin || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
              }))}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              value={formData.socialLinks?.twitter || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, twitter: e.target.value }
              }))}
              placeholder="https://twitter.com/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={formData.socialLinks?.github || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, github: e.target.value }
              }))}
              placeholder="https://github.com/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.socialLinks?.website || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, website: e.target.value }
              }))}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
