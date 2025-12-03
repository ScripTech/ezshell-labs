import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { organizations, users } from '@/db/schemas'
import { eq, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // Fetch organizations with member count
    const orgsWithMembers = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        // website: organizations.website,
        logo: organizations.logo,
        industry: organizations.industry,
        size: organizations.size,
        country: organizations.country,
        plan: organizations.plan,
        maxUsers: organizations.maxUsers,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        memberCount: sql<number>`count(${users.id})`.as('memberCount'),
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.id, users.organizationId))
      .groupBy(organizations.id)
      .orderBy(organizations.createdAt)

    return NextResponse.json(orgsWithMembers)

  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      website,
      industry,
      size,
      country,
      plan,
      maxUsers
    } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { error: 'Organization slug is required' },
        { status: 400 }
      )
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      )
    }

    if (!maxUsers || maxUsers < 1) {
      return NextResponse.json(
        { error: 'Max users must be at least 1' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check if slug is already taken
    const existingOrg = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1)

    if (existingOrg.length > 0) {
      return NextResponse.json(
        { error: 'An organization with this slug already exists' },
        { status: 400 }
      )
    }

    // Validate plan
    if (!['free', 'basic', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Validate size if provided
    if (size && !['startup', 'small', 'medium', 'large', 'enterprise'].includes(size)) {
      return NextResponse.json(
        { error: 'Invalid organization size' },
        { status: 400 }
      )
    }

    // Create organization
    const newOrg = await db
      .insert(organizations)
      .values({
        id: randomUUID(),
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        industry: industry || null,
        size: size || null,
        country: country?.trim() || null,
        plan,
        maxUsers: parseInt(maxUsers.toString()),
        isActive: true,
        owner_id: session.user.id
      })
      .returning()

    return NextResponse.json(newOrg[0], { status: 201 })

  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
