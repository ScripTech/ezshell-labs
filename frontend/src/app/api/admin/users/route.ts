import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { isAdmin, authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schemas/UserSchema";

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log("Session in GET /api/admin/users:", session);
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const result = await db.select().from(users);
    // Map to frontend shape if needed
    const userList = result.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      emailVerified: user.emailVerified,
    }));
    return NextResponse.json(userList);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Add POST, PUT, DELETE as needed, all with isAdmin check
