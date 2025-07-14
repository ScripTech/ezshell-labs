"use client"

import { useEffect, useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface LabTask {
  id: string
  title: string
  description?: string
  points: number
  order: number
  difficulty?: string
}

interface LabTasksOverviewProps {
  labId: string
}

export function LabTasksOverview({ labId }: LabTasksOverviewProps) {
  const [tasks, setTasks] = useState<LabTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true)
      try {
        const res = await fetch(`/api/labs/${labId}/tasks`)
        const data = await res.json()
        setTasks(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch lab tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    if (labId) fetchTasks()
  }, [labId])

  if (loading) {
    return <div className="p-4">Loading tasks...</div>
  }

  if (!tasks.length) {
    return <div className="p-4">No tasks found for this lab.</div>
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Lab Tasks Overview</h3>
      <Accordion type="single" collapsible className="w-full">
        {tasks.map((task) => (
          <AccordionItem key={task.id} value={task.id}>
            <AccordionTrigger className="flex justify-between">
              <div className="flex items-center gap-3 justify-between w-full">
                <div className="">
                  <span className="font-medium">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm py-1 text-muted-foreground font-semibold">
                    {task.points} pts
                  </span>
                  {task.difficulty && (
                    <span className={`text-xs px-2 py-1 uppercase`}>
                      {task.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                {task.description && (
                  <p className="text-muted-foreground text-sm">{task.description}</p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Task {task.order} • {task.points} points
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
