"use client"

import { useState, useEffect } from "react"
import { Plus, MoreHorizontal, Users, Clock } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EnrollmentManagementService } from "@/services/enrollmentManagementService"
import { EnrollmentWithDetails, EnrollmentFilters, User, Lab } from "@/types/enrollment-management"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { CreateEnrollmentDialog } from './CreateEnrollmentDialog';

export function EnrollmentManagement() {
  const { data: session } = useSession()
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<EnrollmentFilters>({ page: 1, limit: 20 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [users, setUsers] = useState<User[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null)

  // Check admin access
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadEnrollments()
      loadUsersAndLabs()
    }
  }, [filters, isAdmin])

  const loadEnrollments = async () => {
    setLoading(true)
    try {
      const response = await EnrollmentManagementService.getEnrollments(filters)
      setEnrollments(response.enrollments)
      setPagination(response.pagination)
    } catch (error) {
      toast.error("Failed to load enrollments")
      console.error("Error loading enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsersAndLabs = async () => {
    try {
      const [usersResponse, labsResponse] = await Promise.all([
        EnrollmentManagementService.getUsers({ limit: 100 }),
        EnrollmentManagementService.getLabs({ limit: 100 })
      ])
      setUsers(usersResponse)
      setLabs(labsResponse.labs)
    } catch (error) {
      console.error("Error loading users and labs:", error)
    }
  }

  const handleCreateEnrollment = async (userId: string, labId: string) => {
    try {
      await EnrollmentManagementService.createEnrollment({ userId, labId })
      toast.success("User enrolled successfully! Enrollment notification email has been sent.")
      loadEnrollments()
      setCreateDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to create enrollment")
    }
  }

  const handleDeleteEnrollment = async () => {
    if (!selectedEnrollment) return

    try {
      await EnrollmentManagementService.deleteEnrollment(selectedEnrollment.enrollment.id)
      toast.success("User unenrolled successfully")
      loadEnrollments()
    } catch (error: any) {
      toast.error(error.message || "Failed to unenroll user")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedEnrollment(null)
    }
  }

  const handleUpdateStatus = async (enrollmentId: string, status: string) => {
    try {
      await EnrollmentManagementService.updateEnrollment(enrollmentId, { status })
      toast.success("Enrollment status updated")
      loadEnrollments()
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    }
  }

  const handleFilterChange = (key: keyof EnrollmentFilters, value: string | number | undefined) => {
    if (value ==="all") {
      value = undefined // Reset to undefined for "all" option
    }
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'number' ? value : 1) // Reset to page 1 when changing filters
    }))
  }

  const getStatusBadge = (status: string | null) => {
    const className = EnrollmentManagementService.getStatusColor(status)
    return (
      <Badge variant="outline" className={className}>
        {status || 'Unknown'}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const className = EnrollmentManagementService.getRoleColor(role)
    return (
      <Badge variant="outline" className={className}>
        {role}
      </Badge>
    )
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>You don&apos;t have permission to manage enrollments.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enrollment Management</h1>
          <p className="text-muted-foreground">
            Manage user lab enrollments and track progress
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Enroll User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Select
                value={filters.userId || ""}
                onValueChange={(value) => handleFilterChange('userId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Lab</label>
              <Select
                value={filters.labId || ""}
                onValueChange={(value) => handleFilterChange('labId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Labs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labs</SelectItem>
                  {labs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Page Size</label>
              <Select
                value={filters.limit?.toString() || "20"}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Enrollments ({pagination.total})
          </CardTitle>
          <CardDescription>
            Showing {enrollments.length} of {pagination.total} enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading enrollments...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No enrollments found.</p>
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Enrollment
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((item) => (
                    <TableRow key={item.enrollment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.user?.name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{item.user?.email}</p>
                          {item.user?.role && getRoleBadge(item.user.role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.lab?.name || 'Unknown Lab'}</p>
                          <p className="text-sm text-muted-foreground">
                            {EnrollmentManagementService.formatDuration(item.lab?.duration || 0)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.enrollment.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{item.enrollment.progress || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {EnrollmentManagementService.formatDate(item.enrollment.enrolledAt)}
                          </p>
                          {item.enrollment.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Completed: {EnrollmentManagementService.formatDate(item.enrollment.completedAt)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{item.sessionCount || 0} sessions</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(item.enrollment.id, 'completed')}
                              disabled={item.enrollment.status === 'completed'}
                            >
                              Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(item.enrollment.id, 'in_progress')}
                              disabled={item.enrollment.status === 'in_progress'}
                            >
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEnrollment(item)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-destructive"
                            >
                              Unenroll User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, pagination.page + 1))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Enrollment Dialog */}
      <CreateEnrollmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        users={users}
        labs={labs}
        onSubmit={handleCreateEnrollment}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unenroll User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unenroll &quot;{selectedEnrollment?.user?.name}&quot; from
              &quot;{selectedEnrollment?.lab?.name}&quot;? This action cannot be undone and will
              remove all progress data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEnrollment}>
              Unenroll User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
