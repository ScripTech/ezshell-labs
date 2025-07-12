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
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  duration: z.number().int().min(10, "Minimum duration is 10 minutes").max(240, "Maximum duration is 240 minutes"),
  imageUrl: z.string().url("Must be a valid URL").optional(),
})

export function LabForm() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)


  const form = useForm<z.infer<typeof labSchema>>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 30,
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
      const res = await fetch("/api/admin/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })
      if (!res.ok) {
        const data = await res.json()
        setApiError(data.error || "Failed to create lab")
        setLoading(false)
        return
      }
      router.push("/admin/labs")
    } catch (err) {
      setApiError("Failed to create lab")
      setLoading(false)
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
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Lab"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
