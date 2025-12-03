"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  LabTask,
  TaskEditFormData,
  TASK_STATUS_OPTIONS,
  DIFFICULTY_OPTIONS
} from "@/types/lab-tasks"
import { LabTasksService } from "@/services/labTasksService"
import { toast } from "sonner"

const taskEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  difficulty: z.string().optional(),
  points: z.coerce.number().min(0, "Points must be 0 or greater"),
  hint: z.string().optional(),
  markdown: z.string().optional(),
  isEnabled: z.boolean(),
  status: z.enum(['active', 'maintenance', 'deprecated', 'review']),
  maintenanceMessage: z.string().optional(),
})

interface TaskEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: LabTask | null
  labId: string
  onTaskUpdated: () => void
}

export function TaskEditDialog({
  open,
  onOpenChange,
  task,
  labId,
  onTaskUpdated
}: TaskEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!task

  const form = useForm<TaskEditFormData>({
    resolver: zodResolver(taskEditSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "",
      points: 0,
      hint: "",
      markdown: "",
      isEnabled: true,
      status: "active",
      maintenanceMessage: "",
    },
  })

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        difficulty: task.difficulty || "",
        points: task.points,
        hint: task.hint || "",
        markdown: task.markdown || "",
        isEnabled: task.isEnabled,
        status: task.status,
        maintenanceMessage: task.maintenanceMessage || "",
      })
    } else {
      form.reset({
        title: "",
        description: "",
        difficulty: "",
        points: 0,
        hint: "",
        markdown: "",
        isEnabled: true,
        status: "active",
        maintenanceMessage: "",
      })
    }
  }, [task, form])

  const onSubmit = async (data: TaskEditFormData) => {
    setLoading(true)
    try {
      if (isEdit && task) {
        await LabTasksService.updateTask(labId, task.id, data)
        toast.success("Task updated successfully")
      } else {
        await LabTasksService.createTask(labId, data)
        toast.success("Task created successfully")
      }
      onTaskUpdated()
      onOpenChange(false)
    } catch (error) {
      toast.error(isEdit ? "Failed to update task" : "Failed to create task")
      console.error("Error saving task:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Edit the task details and settings below."
              : "Create a new task for this lab."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the task..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hint</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional hint for students..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="markdown"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Markdown Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full task content in markdown..."
                      className="resize-none font-mono text-sm"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Full task instructions in markdown format
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Task Status & Availability</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TASK_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`bg-${option.color}-50`}>
                                  {option.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <FormDescription className="text-xs">
                          Students can see this task
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("status") === "maintenance" && (
                <FormField
                  control={form.control}
                  name="maintenanceMessage"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Maintenance Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Message to display when task is under maintenance..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
