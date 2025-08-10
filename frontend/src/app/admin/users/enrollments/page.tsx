"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Lab } from '@/types/labs'
import {
  Search,
  UserPlus,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Settings,
  AlertCircle
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  image?: string
}

interface Enrollment {
  user: User
  lab: Lab,
  enrollment: {
    id: string
    userId: string
    labId: string
    status: 'enrolled' | 'provisioning' | 'provisioning_failed' | 'in_progress' | 'completed'
    progress: number
    enrolledAt: string
    completedAt?: string
  },
  provision: {
    id: string,
    publicIp: string,
    instanceState: string,
    provisionedAt: string,
  } | null
}

export default function AdminEnrollmentsPage() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLab, setSelectedLab] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)

  const fetchData = async () => {
    try {
      const [labsResponse, usersResponse, enrollmentsResponse] = await Promise.all([
        fetch('/api/admin/labs'),
        fetch('/api/admin/users'),
        fetch('/api/admin/enrollments')
      ])

      if (!labsResponse.ok || !usersResponse.ok || !enrollmentsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [labsData, usersData, enrollmentsData] = await Promise.all([
        labsResponse.json(),
        usersResponse.json(),
        enrollmentsResponse.json()
      ])
      // Ensure we have arrays
      setLabs(Array.isArray(labsData) ? labsData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setEnrollments(Array.isArray(enrollmentsData.enrollments) ? enrollmentsData.enrollments : [])
      console.log('Fetched enrollments:', enrollments)
    } catch (error) {
      toast.error('Failed to load data')
      console.error(error)
      // Set empty arrays on error
      setLabs([])
      setUsers([])
      setEnrollments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch =
      enrollment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.lab.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLab = !selectedLab || selectedLab === 'all' || enrollment.enrollment.labId === selectedLab

    return matchesSearch && matchesLab
  })

  const handleEnrollUser = async () => {
    if (!selectedUser || !selectedLab) {
      toast.error('Please select both user and lab')
      return
    }

    setIsEnrolling(true)
    try {
      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          labId: selectedLab,
          autoProvision: true // Automatically provision AWS resources
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enroll user')
      }

      const enrollment = await response.json()
      setEnrollments(prev => [enrollment, ...prev])
      setShowEnrollDialog(false)
      setSelectedUser('')
      setSelectedLab('')
      toast.success('User enrolled successfully and lab environment is being provisioned')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enroll user')
      console.error(error)
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleProvisionLab = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}/provision`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to provision lab')
      }

      toast.success('Lab provisioning started')
      // Refresh enrollments to see updated status
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to provision lab')
      console.error(error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-blue-100 text-blue-800'
      case 'provisioning': return 'bg-orange-100 text-orange-800'
      case 'provisioning_failed': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    console.log("getStatusIcon called with status:", status);
    switch (status) {
      case 'enrolled': return <Clock className="w-4 h-4" />
      case 'provisioning': return <Settings className="w-4 h-4 animate-spin" />
      case 'provisioning_failed': return <AlertCircle className="w-4 h-4" />
      case 'in_progress': return <Play className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <XCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading enrollments...</p>
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
          <h1 className="text-3xl font-bold">User Enrollments</h1>
          <p className="text-muted-foreground">Manage user lab enrollments and provisioning</p>
        </div>
        <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll User in Lab</DialogTitle>
              <DialogDescription>
                Select a user and lab to create a new enrollment with automatic AWS provisioning
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name} ({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lab">Lab</Label>
                <Select value={selectedLab} onValueChange={setSelectedLab}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name} - {lab.duration} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEnrollUser} disabled={isEnrolling || !selectedUser || !selectedLab}>
                {isEnrolling ? 'Enrolling...' : 'Enroll & Provision'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(enrollments || []).length}</div>
          </CardContent>
        </Card>
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(enrollments || []).filter(e => e.enrollment.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(enrollments || []).filter(e => e.enrollment.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card className='shadow-none rounded-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(enrollments || []).filter(e => e.enrollment.status === 'enrolled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search enrollments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            // iconLeft={<Search className="w-4 h-4 text-muted-foreground" />}
          />
        </div>
        <Select value={selectedLab} onValueChange={setSelectedLab}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by lab" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All labs</SelectItem>
            {labs.map((lab) => (
              <SelectItem key={lab.id} value={lab.id}>
                {lab.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enrollments Table */}
      <Card className='shadow-none rounded-md'>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
          <CardDescription>
            Manage user lab enrollments and provisioning status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollmentItem) => (
                <TableRow key={enrollmentItem.enrollment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={enrollmentItem.user.image} alt={enrollmentItem.user.name} />
                        <AvatarFallback>
                          {enrollmentItem.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{enrollmentItem.user.name}</div>
                        <div className="text-xs text-muted-foreground">{enrollmentItem.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{enrollmentItem.lab.name}</div>
                      <div className="text-xs text-muted-foreground">{enrollmentItem.lab.duration} minutes</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(enrollmentItem.enrollment.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(enrollmentItem.enrollment.status)}
                        <span className="capitalize">{enrollmentItem.enrollment.status.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${enrollmentItem.enrollment.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{enrollmentItem.enrollment.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(enrollmentItem.enrollment.enrolledAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {(!enrollmentItem.provision) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProvisionLab(enrollmentItem.enrollment.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Provision
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEnrollments.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No enrollments found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedLab ? 'No enrollments match your filters.' : 'No enrollments available.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
