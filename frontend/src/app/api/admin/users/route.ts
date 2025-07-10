
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const users: any = []
  return NextResponse.json(users);
}

// Add POST, PUT, DELETE as needed, all with isAdmin check
