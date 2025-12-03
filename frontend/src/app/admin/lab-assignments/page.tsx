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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Instructor } from '@/types/instructors'
import { Lab } from '@/types/labs'
import { Search, UserCheck, UserX } from 'lucide-react'

export default function LabInstructorAssignmentsPage() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [labsResponse, instructorsResponse] = await Promise.all([
        fetch('/api/admin/labs'),
        fetch('/api/admin/instructors')
      ])

      if (!labsResponse.ok || !instructorsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [labsData, instructorsData] = await Promise.all([
        labsResponse.json(),
        instructorsResponse.json()
      ])

      setLabs(labsData)
      setInstructors(instructorsData.filter((i: Instructor) => i.isActive))
    } catch (error) {
      toast.error('Failed to load data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAssignInstructor = async (labId: string, instructorId: string | null) => {
    setUpdating(labId)
    try {
      const response = await fetch(`/api/admin/labs/${labId}/instructor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId })
      })

      if (!response.ok) throw new Error('Failed to update assignment')

      // Update local state
      setLabs(prev => prev.map(lab =>
        lab.id === labId
          ? {
              ...lab,
              instructor: instructorId
                ? instructors.find(i => i.id === instructorId)
                : undefined
            }
          : lab
      ))

      toast.success(
        instructorId
          ? 'Instructor assigned successfully'
          : 'Instructor unassigned successfully'
      )
    } catch (error) {
      toast.error('Failed to update assignment')
      console.error(error)
    } finally {
      setUpdating(null)
    }
  }

  const getInstructorById = (id: string) => {
    return instructors.find(instructor => instructor.id === id)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lab Instructor Assignments</h1>
        <p className="text-muted-foreground">Assign instructors to labs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Labs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {labs.filter(lab => lab.instructor).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Labs</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {labs.filter(lab => !lab.instructor).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search labs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Assignments</CardTitle>
          <CardDescription>
            Manage instructor assignments for each lab
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lab</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Current Instructor</TableHead>
                <TableHead>Assign Instructor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLabs.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lab.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {lab.labId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{lab.duration} minutes</TableCell>
                  <TableCell>
                    {lab.instructor ? (
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={lab.instructor.avatar} alt={lab.instructor.name} />
                          <AvatarFallback>
                            {lab.instructor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{lab.instructor.name}</div>
                          <div className="text-xs text-muted-foreground">{lab.instructor.title}</div>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lab.instructor?.id || ''}
                      onValueChange={(value) => handleAssignInstructor(lab.id, value || null)}
                      disabled={updating === lab.id}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassign">Unassign</SelectItem>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={instructor.avatar} alt={instructor.name} />
                                <AvatarFallback className="text-xs">
                                  {instructor.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{instructor.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {lab.instructor && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignInstructor(lab.id, null)}
                        disabled={updating === lab.id}
                      >
                        {updating === lab.id ? 'Updating...' : 'Unassign'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLabs.length === 0 && (
            <div className="text-center py-12">
              <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No labs found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No labs match your search.' : 'No labs available for assignment.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
