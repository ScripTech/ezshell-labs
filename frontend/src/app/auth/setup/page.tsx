'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSetupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [loading, setLoading] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/auth/setup')
        const data = await response.json()

        if (data.hasAdmin) {
          // Admin already exists, redirect to login
          router.push('/auth/login')
          return
        }

        setNeedsSetup(true)
      } catch (error) {
        console.error('Error checking setup status:', error)
        toast.error('Failed to check setup status')
      } finally {
        setCheckingSetup(false)
      }
    }
    checkSetupStatus()
  }, [router])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/auth/setup')
      const data = await response.json()

      if (data.hasAdmin) {
        // Admin already exists, redirect to login
        router.push('/auth/login')
        return
      }

      setNeedsSetup(true)
    } catch (error) {
      console.error('Error checking setup status:', error)
      toast.error('Failed to check setup status')
    } finally {
      setCheckingSetup(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])

    // Validate form
    const newErrors: string[] = []

    if (!formData.email) newErrors.push('Email is required')
    if (!formData.password) newErrors.push('Password is required')
    if (!formData.confirmPassword) newErrors.push('Confirm password is required')
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details)
        } else {
          setErrors([data.error || 'Failed to create admin user'])
        }
        return
      }

      toast.success('Admin user created successfully!')
      router.push('/auth/login?message=setup-complete')

    } catch (error) {
      console.error('Error creating admin:', error)
      setErrors(['Failed to create admin user'])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking setup status...</p>
        </div>
      </div>
    )
  }

  if (!needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Setup Complete</h2>
              <p className="text-muted-foreground mb-4">
                Admin user already exists. Redirecting to login...
              </p>
              <Button onClick={() => router.push('/auth/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Create the first administrator account for your EZShell Labs instance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name (Optional)</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter secure password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                'Create Admin Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
