import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { organizations, users } from '@/db/schemas'
import { eq, sql } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { organizationId } = params

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Fetch organization with member count and member details
    const orgResult = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        website: organizations.website,
        logo: organizations.logo,
        industry: organizations.industry,
        size: organizations.size,
        country: organizations.country,
        timezone: organizations.timezone,
        plan: organizations.plan,
        maxUsers: organizations.maxUsers,
        billingEmail: organizations.billingEmail,
        isActive: organizations.isActive,
        isVerified: organizations.isVerified,
        settings: organizations.settings,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        memberCount: sql<number>`count(${users.id})`.as('memberCount'),
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.id, users.organizationId))
      .where(eq(organizations.id, organizationId))
      .groupBy(organizations.id)
      .limit(1)

    if (orgResult.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Fetch organization members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, organizationId))
      .orderBy(users.createdAt)

    const response = {
      ...orgResult[0],
      members,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching organization details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { organizationId } = params
    const body = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const {
      name,
      slug,
      description,
      website,
      industry,
      size,
      country,
      timezone,
      plan,
      maxUsers,
      billingEmail,
      isActive,
      settings
    } = body

    // Check if organization exists
    const existingOrg = await db
      .select({ id: organizations.id, slug: organizations.slug })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    if (existingOrg.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Validate slug if it's being changed
    if (slug && slug !== existingOrg[0].slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }

      // Check if new slug is already taken
      const slugCheck = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1)

      if (slugCheck.length > 0) {
        return NextResponse.json(
          { error: 'An organization with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Validate plan if provided
    if (plan && !['free', 'basic', 'pro', 'enterprise'].includes(plan)) {
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

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name.trim()
    if (slug !== undefined) updateData.slug = slug.trim().toLowerCase()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (website !== undefined) updateData.website = website?.trim() || null
    if (industry !== undefined) updateData.industry = industry || null
    if (size !== undefined) updateData.size = size || null
    if (country !== undefined) updateData.country = country?.trim() || null
    if (timezone !== undefined) updateData.timezone = timezone?.trim() || null
    if (plan !== undefined) updateData.plan = plan
    if (maxUsers !== undefined) updateData.maxUsers = parseInt(maxUsers.toString())
    if (billingEmail !== undefined) updateData.billingEmail = billingEmail?.trim() || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (settings !== undefined) updateData.settings = settings

    // Update organization
    await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, organizationId))

    // Fetch updated organization
    const updatedOrgResult = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        website: organizations.website,
        logo: organizations.logo,
        industry: organizations.industry,
        size: organizations.size,
        country: organizations.country,
        timezone: organizations.timezone,
        plan: organizations.plan,
        maxUsers: organizations.maxUsers,
        billingEmail: organizations.billingEmail,
        isActive: organizations.isActive,
        isVerified: organizations.isVerified,
        settings: organizations.settings,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        memberCount: sql<number>`count(${users.id})`.as('memberCount'),
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.id, users.organizationId))
      .where(eq(organizations.id, organizationId))
      .groupBy(organizations.id)
      .limit(1)

    return NextResponse.json(updatedOrgResult[0])

  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { organizationId } = params

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Check if organization exists
    const existingOrg = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    if (existingOrg.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if organization has members
    const memberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.organizationId, organizationId))

    if (memberCount[0].count > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete organization with existing members. Please remove all members first.',
          details: [`Organization has ${memberCount[0].count} member(s)`]
        },
        { status: 400 }
      )
    }

    // Delete organization
    await db
      .delete(organizations)
      .where(eq(organizations.id, organizationId))

    return NextResponse.json({
      success: true,
      message: `Organization "${existingOrg[0].name}" deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
