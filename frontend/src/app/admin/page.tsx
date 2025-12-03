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
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="enrollments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Enrollment Management</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Email Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-6">
          <EnrollmentManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Email Template Management</span>
              </CardTitle>
              <CardDescription>
                View, edit, and preview your email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Template Editor</h3>
                    <p className="text-sm text-muted-foreground">
                      Edit email templates with live preview
                    </p>
                  </div>
                  <a
                    href="/admin/templates"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Open Template Editor
                  </a>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Test Email Service</h3>
                    <p className="text-sm text-muted-foreground">
                      Send test emails and validate templates
                    </p>
                  </div>
                  <a
                    href="/admin/test-email"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                  >
                    Test Email Service
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Available Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Account Validation</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lab Provisioning</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lab Ready</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lab Completion</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lab Expiration</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>General Notification</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Campaign</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Instructor Assignment</span>
                          <span className="text-green-600">✓ Ready</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Templates</span>
                          <span className="font-medium">8 types</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">HTML Templates</span>
                          <span className="font-medium">8 files</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Text Templates</span>
                          <span className="font-medium">8 files</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Template Engine</span>
                          <span className="font-medium">Handlebars</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Status</span>
                          <span className="text-green-600 font-medium">All Ready</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
