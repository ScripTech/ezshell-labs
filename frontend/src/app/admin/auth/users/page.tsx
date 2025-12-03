'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, User, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import CreateForm, { FormField } from '@/components/shared/CreateForm'

interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'manager' | 'user' | 'clientUser'
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function AdminUserManagementPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user || session.user.role !== 'admin') {
      redirect('/auth/login')
      return
    }

    fetchUsers()
  }, [session, status])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/auth/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const userData = await response.json()
      setUsers(userData)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (data: Record<string, any>) => {
    try {
      const response = await fetch('/api/admin/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create user',
          details: result.details,
        }
      }

      fetchUsers() // Refresh user list
      return { success: true }

    } catch (error) {
      console.error('Error creating user:', error)
      return {
        success: false,
        error: 'Failed to create user',
      }
    }
  }

  // Define form fields for CreateForm component
  const userFormFields: FormField[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter full name',
      required: false,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'user@example.com',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Enter secure password',
      required: true,
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm password',
      required: true,
    },
    {
      name: 'role',
      label: 'User Role',
      type: 'select',
      required: true,
      options: [
        { value: 'user', label: 'User' },
        { value: 'manager', label: 'Manager' },
        { value: 'admin', label: 'Admin' },
        { value: 'clientUser', label: 'Client User' },
      ],
    },
  ]

  // Custom validation for password confirmation
  const validateUserForm = (data: Record<string, any>): string[] => {
    const errors: string[] = []

    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match')
    }

    if (data.password && data.password.length < 6) {
      errors.push('Password must be at least 6 characters long')
    }

    return errors
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      manager: 'default',
      user: 'secondary',
      clientUser: 'outline',
    }

    return (
      <Badge variant={variants[role as keyof typeof variants] as any}>
        {role}
      </Badge>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <CreateForm
        title="Create New User"
        description="Add a new user to the system with specified role and permissions"
        fields={userFormFields}
        onSubmit={handleCreateUser}
        onCancel={() => setShowCreateForm(false)}
        submitLabel="Create User"
        isVisible={showCreateForm}
        customValidation={validateUserForm}
      />

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            All users registered in the system ({users.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-full">
                    {user.role === 'admin' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getRoleBadge(user.role)}
                  {user.emailVerified && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found. Create the first user to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
