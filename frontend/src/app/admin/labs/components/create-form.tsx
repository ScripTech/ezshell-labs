"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState } from "react"


const labSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  labId: z.string().min(3, "Lab ID is required").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  duration: z.number().int().min(10, "Minimum duration is 10 minutes").max(240, "Maximum duration is 240 minutes"),
  imageUrl: z.string().optional(),
})

export function LabForm({
  initialValues,
  labId,
  mode = "create",
}: {
  initialValues?: {
    name: string
    labId: string
    description: string
    duration: number
    imageUrl?: string
  }
  labId?: string
  mode?: "create" | "edit"
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [migratingQuestions, setMigratingQuestions] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null)


  const form = useForm<z.infer<typeof labSchema>>({
    resolver: zodResolver(labSchema),
    defaultValues: initialValues || {
      name: "",
      labId: "",
      description: "",
      duration: 60, // Default duration
      imageUrl: "",
    },
  })

  async function handleSubmit(values: z.infer<typeof labSchema>) {
    setErrors({})
    setApiError(null)
    const result = labSchema.safeParse({
      ...values,
      duration: Number(values.duration),
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setLoading(true)
    try {
      const url = mode === "edit" && labId
        ? `/api/admin/labs/${labId}`
        : "/api/admin/labs"
      const method = mode === "edit" ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })
      if (!res.ok) {
        const data = await res.json()
        setApiError(data.error || "Failed to save lab")
        setLoading(false)
        return
      }
      router.push("/admin/labs")
    } catch (err) {
      setApiError("Failed to save lab")
      setLoading(false)
    }
  }

  async function handleMigrateQuestions() {
    if (!labId && !initialValues?.labId) {
      setApiError("Lab ID is required for migration")
      return
    }

    setMigratingQuestions(true)
    setApiError(null)
    setMigrationSuccess(null)

    try {
      const url = `/api/admin/labs/import-tasks`
      const res = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labId: labId,
          labFolder: initialValues?.labId
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setApiError(data.error || "Failed to migrate questions")
        return
      }

      const result = await res.json()
      setMigrationSuccess(`Successfully migrated ${result.count || 'questions'} for lab ${initialValues?.labId}`)
    } catch (err) {
      setApiError("Failed to migrate questions")
    } finally {
      setMigratingQuestions(false)
    }
  }


  return (
    <div className="max-w-4xl mx-auto p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Lab name" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lab ID</FormLabel>
                <FormControl>
                  <Input placeholder="Lab ID" {...field} />
                </FormControl>
                <FormDescription>
                  This is your unique lab identifier.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={10}
                    max={240}
                    placeholder="Duration"
                    {...field}
                    value={field.value}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Duration of the lab in minutes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.png" {...field} />
                </FormControl>
                <FormDescription>
                  Optional image for the lab.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Markdown)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Lab description in markdown"
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Write a detailed description for the lab.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {apiError && (
            <div className="text-red-600 text-sm">{apiError}</div>
          )}
          {migrationSuccess && (
            <div className="text-green-600 text-sm">{migrationSuccess}</div>
          )}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading || migratingQuestions}>
              {loading ? (mode === "edit" ? "Saving..." : "Creating...") : (mode === "edit" ? "Save Changes" : "Create Lab")}
            </Button>
            {mode === "edit" && labId && (
              <Button
                type="button"
                variant="outline"
                disabled={loading || migratingQuestions}
                onClick={handleMigrateQuestions}
              >
                {migratingQuestions ? "Migrating..." : "Migrate Questions"}
              </Button>
            )}
          </div>
          {migrationSuccess && (
            <div className="text-green-600 text-sm">{migrationSuccess}</div>
          )}
        </form>
      </Form>
    </div>
  )
}
