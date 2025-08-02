// Types for enrollment management

export interface User {
  id: string
  name: string | null
  email: string | null
  role: 'user' | 'admin' | 'manager' | 'clientUser'
  image?: string | null
  emailVerified?: Date | null
  createdAt?: Date | null
}

export interface Lab {
  id: string
  name: string
  labId: string | null
  description: string | null
  duration: number
}

export interface Enrollment {
  id: string
  userId: string | null
  labId: string | null
  enrolledAt: Date | null
  completedAt: Date | null
  progress: number | null
  status: string | null
}

export interface EnrollmentWithDetails {
  enrollment: Enrollment
  user: User | null
  lab: Lab | null
  sessionCount?: number
}

export interface EnrollmentListResponse {
  enrollments: EnrollmentWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateEnrollmentRequest {
  userId: string
  labId: string
}

export interface UpdateEnrollmentRequest {
  status?: string
  progress?: number
}

// Analytics types
export interface AnalyticsOverview {
  totalUsers: number
  totalLabs: number
  totalEnrollments: number
  completedEnrollments: number
  activeSessions: number
  completionRate: number
}

export interface PopularLab {
  lab: {
    id: string
    name: string
    labId: string | null
  }
  enrollmentCount: number
}

export interface UserEngagement {
  role: string
  userCount: number
  enrollmentCount: number
  avgProgress: number
}

export interface EnrollmentTrend {
  date: string
  enrollments: number
}

export interface CompletionRate {
  lab: {
    id: string
    name: string
    labId: string | null
  }
  totalEnrollments: number
  completedEnrollments: number
  completionRate: number
  avgProgress: number
}

export interface SessionAnalytics {
  avgSessionDuration: number
  totalSessions: number
  activeSessions: number
}

export interface TopUser {
  user: {
    id: string
    name: string | null
    email: string | null
    role: string
  }
  enrollmentCount: number
  completedCount: number
  avgProgress: number
  totalSessions: number
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview
  popularLabs: PopularLab[]
  userEngagement: UserEngagement[]
  enrollmentTrends: EnrollmentTrend[]
  completionRates: CompletionRate[]
  sessionAnalytics: SessionAnalytics
  topUsers: TopUser[]
  timeframe: number
  labId?: string | null
}

// Form data types
export interface EnrollmentFormData {
  userId: string
  labId: string
}

export interface EnrollmentFilters {
  labId?: string
  userId?: string
  status?: string
  page?: number
  limit?: number
}

export interface UserSearchParams {
  search?: string
  role?: string
  limit?: number
}

export interface LabSearchParams {
  search?: string
  limit?: number
}
