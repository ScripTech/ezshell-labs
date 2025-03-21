import { getServerSession } from 'next-auth/next'
import { LabSessionService } from '@/services/labSession'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authOptions } from '../[...nextauth]/route'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string | null
    } & DefaultSession['user']
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const labSession = await LabSessionService.createLabSession(session.user.id)
    return NextResponse.json(labSession)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
