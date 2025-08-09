export interface Instructor {
  id: string
  name: string
  title: string
  bio?: string
  avatar?: string
  email?: string
  experience?: string
  specializations?: string[]
  socialLinks?: {
    linkedin?: string
    twitter?: string
    github?: string
    website?: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateInstructorData {
  name: string
  title: string
  bio?: string
  avatar?: string
  email?: string
  experience?: string
  specializations?: string[]
  socialLinks?: {
    linkedin?: string
    twitter?: string
    github?: string
    website?: string
  }
}

export interface UpdateInstructorData extends Partial<CreateInstructorData> {
  id: string
  isActive?: boolean
}
