"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LabForm } from "../components/create-form"


export default function CreateLabPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: 30,
    imageUrl: "",
  })



  return (
    <div className="flex flex-col px-4">
      <div className="max-w-4xl p-6">
        <div className="">Create New Lab</div>
        <Card className="border-none space-y-3">
          <CardContent>
            <LabForm/>
            {/* <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Lab name"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage>{errors.name}</FormMessage>
              </div>
              <div>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={10}
                    max={240}
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                    placeholder="Duration"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage>{errors.duration}</FormMessage>
              </div>
              <div>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.png"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage>{errors.imageUrl}</FormMessage>
              </div>
              <div>
                <FormLabel>Description (Markdown)</FormLabel>
                <FormControl>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Lab description in markdown"
                    rows={8}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage>{errors.description}</FormMessage>
              </div>
              {apiError && (
                <div className="text-red-600 text-sm">{apiError}</div>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Lab"}
              </Button>
            </form> */}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
