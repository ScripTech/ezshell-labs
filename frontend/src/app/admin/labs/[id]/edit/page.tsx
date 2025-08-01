"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { LabForm } from "../../components/create-form"
import { Card, CardContent } from "@/components/ui/card"
import { LabTaskEditor } from "@/components/lab-task-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditLabPage() {
  const router = useRouter()
  const params = useParams()
  const labId = params?.id as string
  const [lab, setLab] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLab() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/labs/${labId}`)
        if (!res.ok) throw new Error("Failed to fetch lab")
        const data = await res.json()
        setLab(data)
      } catch (err: any) {
        setError("Failed to load lab information.")
      } finally {
        setLoading(false)
      }
    }
    if (labId) fetchLab()
  }, [labId])

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!lab) return <div className="p-6">Lab not found.</div>

  return (
    <div className="flex flex-col px-4">
      <div className="max-w-6xl p-6">
        <div className="mb-6 text-xl font-bold">Edit Lab: {lab.name}</div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Lab Details</TabsTrigger>
            <TabsTrigger value="tasks">Tasks & Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card className="border-none space-y-3">
              <CardContent>
                <LabForm
                  initialValues={{
                    name: lab.name,
                    labId: lab.labId,
                    description: lab.description,
                    duration: lab.duration,
                    imageUrl: lab.imageUrl,
                  }}
                  labId={labId}
                  mode="edit"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <LabTaskEditor
              labId={labId}
              labName={lab.name}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
