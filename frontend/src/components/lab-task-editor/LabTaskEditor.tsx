"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskEditDialog } from "./TaskEditDialog"
import { LabTask, TASK_STATUS_OPTIONS } from "@/types/lab-tasks"
import { LabTasksService } from "@/services/labTasksService"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface LabTaskEditorProps {
  labId: string
  labName?: string
}

export function LabTaskEditor({ labId, labName }: LabTaskEditorProps) {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<LabTask[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LabTask | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<LabTask | null>(null)

  // Only admins can use this component
  const isAdmin = session?.user?.role === 'admin'

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedTasks = await LabTasksService.getLabTasks(labId)
      setTasks(fetchedTasks)
    } catch (error) {
      toast.error("Failed to load tasks")
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }, [labId])

  useEffect(() => {
    if (isAdmin) {
      loadTasks()
    }
  }, [isAdmin, loadTasks])

  const handleCreateTask = () => {
    setSelectedTask(null)
    setEditDialogOpen(true)
  }

  const handleEditTask = (task: LabTask) => {
    setSelectedTask(task)
    setEditDialogOpen(true)
  }

  const handleDeleteTask = (task: LabTask) => {
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      await LabTasksService.deleteTask(labId, taskToDelete.id)
      toast.success("Task deleted successfully")
      loadTasks()
    } catch (error) {
      toast.error("Failed to delete task")
      console.error("Error deleting task:", error)
    } finally {
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    }
  }

  const handleToggleEnabled = async (task: LabTask) => {
    try {
      await LabTasksService.updateTaskStatus(labId, task.id, {
        status: task.status,
        isEnabled: !task.isEnabled,
        maintenanceMessage: task.maintenanceMessage,
      })
      toast.success(`Task ${!task.isEnabled ? 'enabled' : 'disabled'}`)
      loadTasks()
    } catch (error) {
      toast.error("Failed to update task status")
      console.error("Error updating task status:", error)
    }
  }

  const getStatusBadge = (status: string, isEnabled: boolean) => {
    const statusOption = TASK_STATUS_OPTIONS.find(opt => opt.value === status)
    const variant = isEnabled ? "default" : "secondary"

    return (
      <div className="flex items-center gap-2">
        <Badge variant={variant}>
          {statusOption?.label || status}
        </Badge>
        {!isEnabled && (
          <Badge variant="outline" >
            <EyeOff className="h-3 w-3 mr-1" />
            Hidden
          </Badge>
        )}
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>                            You don&apos;t have permission to edit lab tasks.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lab Tasks Editor</CardTitle>
              {labName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Managing tasks for: {labName}
                </p>
              )}
            </div>
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks found for this lab.</p>
              <Button className="mt-4" onClick={handleCreateTask}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono text-sm">
                      {task.order}
                    </TableCell>
                    <TableCell className="font-medium">
                      {task.title}
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description.substring(0, 60)}
                          {task.description.length > 60 && "..."}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.points} pts</Badge>
                    </TableCell>
                    <TableCell>
                      {task.difficulty && (
                        <Badge variant="secondary">{task.difficulty}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status, task.isEnabled)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleEnabled(task)}
                          >
                            {task.isEnabled ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Disable Task
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Enable Task
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteTask(task)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TaskEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
        labId={labId}
        onTaskUpdated={loadTasks}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{taskToDelete?.title}&quot;?
              This action cannot be undone and will also delete all related progress data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteTask}
              variant="destructive"
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
