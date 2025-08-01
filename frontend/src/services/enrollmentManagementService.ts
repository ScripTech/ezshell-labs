import {
  EnrollmentListResponse,
  EnrollmentWithDetails,
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  AnalyticsResponse,
  User,
  Lab,
  EnrollmentFilters,
  UserSearchParams,
  LabSearchParams
} from '@/types/enrollment-management'

export class EnrollmentManagementService {
  private static baseUrl = '/api/admin'

  // Enrollment Management
  static async getEnrollments(filters: EnrollmentFilters = {}): Promise<EnrollmentListResponse> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.labId) params.append('labId', filters.labId)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.status) params.append('status', filters.status)

    const response = await fetch(`${this.baseUrl}/enrollments?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch enrollments: ${response.statusText}`)
    }
    return response.json()
  }

  static async getEnrollment(enrollmentId: string): Promise<EnrollmentWithDetails> {
    const response = await fetch(`${this.baseUrl}/enrollments/${enrollmentId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch enrollment: ${response.statusText}`)
    }
    return response.json()
  }

  static async createEnrollment(data: CreateEnrollmentRequest): Promise<{ message: string; enrollment: any }> {
    const response = await fetch(`${this.baseUrl}/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to create enrollment: ${response.statusText}`)
    }
    return response.json()
  }

  static async updateEnrollment(
    enrollmentId: string,
    data: UpdateEnrollmentRequest
  ): Promise<{ message: string; enrollment: any }> {
    const response = await fetch(`${this.baseUrl}/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to update enrollment: ${response.statusText}`)
    }
    return response.json()
  }

  static async deleteEnrollment(enrollmentId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to delete enrollment: ${response.statusText}`)
    }
    return response.json()
  }

  // Analytics
  static async getAnalytics(timeframe: number = 30, labId?: string): Promise<AnalyticsResponse> {
    const params = new URLSearchParams()
    params.append('timeframe', timeframe.toString())
    if (labId) params.append('labId', labId)

    const response = await fetch(`${this.baseUrl}/analytics?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`)
    }
    return response.json()
  }

  // Users for dropdowns
  static async getUsers(searchParams: UserSearchParams = {}): Promise<User[]> {
    const params = new URLSearchParams()

    if (searchParams.search) params.append('search', searchParams.search)
    if (searchParams.role) params.append('role', searchParams.role)
    if (searchParams.limit) params.append('limit', searchParams.limit.toString())

    const response = await fetch(`${this.baseUrl}/users?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`)
    }
    return response.json()
  }

  // Labs for dropdowns
  static async getLabs(searchParams: LabSearchParams = {}): Promise<{ labs: Lab[] }> {
    const params = new URLSearchParams()

    if (searchParams.search) params.append('search', searchParams.search)
    if (searchParams.limit) params.append('limit', searchParams.limit.toString())

    const response = await fetch(`${this.baseUrl}/labs/simple?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch labs: ${response.statusText}`)
    }
    return response.json()
  }

  // Utility methods
  static formatDate(date: Date | string | null): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  static formatDuration(minutes: number | null): string {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  static getStatusColor(status: string | null): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'enrolled':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'dropped':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  static getRoleColor(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
        return 'bg-indigo-100 text-indigo-800'
      case 'clientUser':
        return 'bg-orange-100 text-orange-800'
      case 'user':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
}
