"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
  Calendar,
  RefreshCw,
  Target,
  Activity
} from "lucide-react"
import { EnrollmentManagementService } from "@/services/enrollmentManagementService"
import { AnalyticsResponse } from "@/types/enrollment-management"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

const CHART_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
]

export function AnalyticsDashboard() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<string>("30")
  const [refreshing, setRefreshing] = useState(false)

  // Check admin access
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics()
    }
  }, [timeFilter, isAdmin])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const timeframeValue = timeFilter === "all" ? undefined : parseInt(timeFilter)
      const params = new URLSearchParams()
      if (timeframeValue) {
        params.append('timeframe', timeframeValue.toString())
      }

      const response = await fetch(`/api/admin/analytics?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      toast.error("Failed to load analytics")
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
    toast.success("Analytics refreshed")
  }

  const formatPercentage = (value: number) => `${Math.round(value * 100) / 100}%`
  const formatDuration = (minutes: number) => EnrollmentManagementService.formatDuration(minutes)

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p>You don&apos;t have permission to view analytics.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into lab enrollments and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {analytics && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.activeSessions} active sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.totalLabs}</div>
                <p className="text-xs text-muted-foreground">
                  Available for enrollment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.completedEnrollments} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.sessionAnalytics.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Lab practice sessions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Labs */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Labs</CardTitle>
                <CardDescription>Labs by enrollment count</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.popularLabs.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.popularLabs.map(item => ({
                      name: item.lab.name,
                      enrollmentCount: item.enrollmentCount
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="enrollmentCount" fill={CHART_COLORS[0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No lab enrollment data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrollment Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Daily enrollment activity</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.enrollmentTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.enrollmentTrends.map(item => ({
                      date: item.date,
                      count: item.enrollments
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No enrollment trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Average sessions per user by role</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.userEngagement.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.userEngagement.map(item => ({
                      role: item.role,
                      averageSessions: item.enrollmentCount / Math.max(item.userCount, 1)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="role" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [value.toFixed(2), "Avg Enrollments per User"]} />
                      <Bar dataKey="averageSessions" fill={CHART_COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No user engagement data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Lab Completion Rates</CardTitle>
                <CardDescription>Percentage of completed vs. enrolled</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.completionRates.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.completionRates.map(item => ({
                      name: item.lab.name,
                      completionRate: item.completionRate
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tickFormatter={formatPercentage} />
                      <Tooltip formatter={(value: any) => [formatPercentage(value as number), "Completion Rate"]} />
                      <Bar dataKey="completionRate" fill={CHART_COLORS[3]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No completion rate data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Session Analytics and Top Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Session Analytics</CardTitle>
                <CardDescription>Lab session duration insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Duration</p>
                      <p className="text-2xl font-bold">
                        {formatDuration(analytics.sessionAnalytics.avgSessionDuration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                      <p className="text-2xl font-bold">
                        {analytics.sessionAnalytics.activeSessions}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                      <p className="text-xl font-semibold">{analytics.sessionAnalytics.totalSessions}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>Users with highest session counts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topUsers.length > 0 ? (
                    analytics.topUsers.map((topUser, index) => (
                      <div key={topUser.user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{topUser.user.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{topUser.user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{topUser.totalSessions} sessions</p>
                          <p className="text-sm text-muted-foreground">
                            {topUser.completedCount} completed
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No user activity data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
