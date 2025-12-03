'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'number'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[] // For select fields
  validation?: (value: string) => string | null // Custom validation function
  grid?: 'full' | 'half' // Grid layout (full width or half width)
}

export interface CreateFormProps {
  title: string
  description?: string
  fields: FormField[]
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<{ success: boolean; error?: string; details?: string[] }>
  onCancel: () => void
  submitLabel?: string
  isVisible: boolean
  customValidation?: (data: Record<string, any>) => string[] // Global form validation
}

export default function CreateForm({
  title,
  description,
  fields,
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Create',
  isVisible,
  customValidation,
}: CreateFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    fields.forEach(field => {
      initial[field.name] = initialData[field.name] || (field.type === 'select' ? '' : '')
    })
    return initial
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): string[] => {
    const validationErrors: string[] = []

    // Field-level validation
    fields.forEach(field => {
      const value = formData[field.name]

      // Required field validation
      if (field.required && (!value || value.trim() === '')) {
        validationErrors.push(`${field.label} is required`)
        return
      }

      // Custom field validation
      if (field.validation && value) {
        const error = field.validation(value)
        if (error) {
          validationErrors.push(error)
        }
      }

      // Built-in validations
      if (value) {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            validationErrors.push(`${field.label} must be a valid email address`)
          }
        }
      }
    })

    // Global form validation
    if (customValidation) {
      const globalErrors = customValidation(formData)
      validationErrors.push(...globalErrors)
    }

    return validationErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors([])

    try {
      const result = await onSubmit(formData)

      if (result.success) {
        toast.success(`${title} created successfully!`)
        onCancel() // Close form and reset
      } else {
        if (result.details) {
          setErrors(result.details)
        } else {
          setErrors([result.error || `Failed to create ${title.toLowerCase()}`])
        }
      }
    } catch (error) {
      console.error(`Error creating ${title.toLowerCase()}:`, error)
      setErrors([`Failed to create ${title.toLowerCase()}`])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setErrors([])
    setFormData(() => {
      const initial: Record<string, any> = {}
      fields.forEach(field => {
        initial[field.name] = initialData[field.name] || (field.type === 'select' ? '' : '')
      })
      return initial
    })
    onCancel()
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] || ''

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleInputChange(field.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'textarea':
        return (
          <Textarea
            id={field.name}
            name={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            rows={3}
          />
        )

      default:
        return (
          <Input
            id={field.name}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        )
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-none rounded-md mb-16">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="mt-2">
              {description}
            </CardDescription>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div
                key={field.name}
                className={`space-y-2 ${field.grid === 'full' ? 'md:col-span-2' : ''}`}
              >
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                submitLabel
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
