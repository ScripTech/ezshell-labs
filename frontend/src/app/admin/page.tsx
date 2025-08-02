"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BarChart3, Settings, Shield } from "lucide-react"
import { EnrollmentManagement } from "@/components/admin/EnrollmentManagement"
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard"
import { useSession } from "next-auth/react"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("enrollments")

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please sign in to access the admin panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (session.user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don&apos;t have permission to access the admin panel.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Current role: {session.user?.role || 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Admin Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Manage users, labs, enrollments, and view analytics
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-sm text-muted-foreground">Logged in as:</span>
          <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {session.user?.role}
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
          <TabsTrigger value="enrollments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Enrollment Management</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics Dashboard</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-6">
          <EnrollmentManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
