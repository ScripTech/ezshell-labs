'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const [cookies, setCookies] = useState<string>('')
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Get all cookies for debugging
    setCookies(document.cookie)
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.log('Failed to fetch users (probably not admin):', error)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will test the authentication flow.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/delete?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('User deleted successfully! They should be logged out automatically.')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(`Failed to delete user: ${error.error}`)
      }
    } catch (error) {
      alert('Error deleting user')
    } finally {
      setIsLoading(false)
    }
  }

  const testApiCall = async () => {
    try {
      const response = await fetch('/api/user/enrolled-tasks')
      const data = await response.json()

      if (response.status === 401) {
        alert('Received 401 - Auth error handler should trigger automatic logout')
      } else {
        alert(`API call successful: ${JSON.stringify(data)}`)
      }
    } catch (error) {
      alert('API call failed')
    }
  }

  const clearAllAuthCookies = () => {
    // Clear all NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      'next-auth.pkce.code_verifier'
    ]

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=localhost; SameSite=Lax`
    })

    // Reload the page
    window.location.reload()
  }

  const forceSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug & Testing</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Session Status</h2>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Session:</strong> {JSON.stringify(session, null, 2)}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">All Cookies</h2>
          <pre className="text-sm whitespace-pre-wrap">{cookies}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Authentication Actions</h2>
          <div className="space-x-4">
            <button
              onClick={clearAllAuthCookies}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear All Auth Cookies
            </button>

            <button
              onClick={forceSignOut}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Force Sign Out
            </button>

            <button
              onClick={testApiCall}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test API Call (401 Check)
            </button>
          </div>
        </div>

        {users.length > 0 && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">User Management (Admin Only)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Delete a user to test if they get automatically logged out from all sessions
            </p>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between bg-white p-2 rounded">
                  <span>{user.email} ({user.role})</span>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={isLoading || user.id === session?.user?.id}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                  >
                    {user.id === session?.user?.id ? 'Current User' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
