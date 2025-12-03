import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { isAdmin, authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schemas/UserSchema";
import { like, or, eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("Session in GET /api/admin/users:", session);
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where conditions
    let whereConditions = []
    if (search) {
      whereConditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      )
    }
    if (role) {
      whereConditions.push(eq(users.role, role as "user" | "admin" | "manager" | "clientUser"))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(users.name)
      .limit(limit)

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Add POST, PUT, DELETE as needed, all with isAdmin check
