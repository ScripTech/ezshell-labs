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
  return (
    <div className="flex flex-col px-4">
      <div className="max-w-4xl p-6">
        <div className="">Create New Lab</div>
        <Card className="border-none space-y-3">
          <CardContent>
            <LabForm/>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
