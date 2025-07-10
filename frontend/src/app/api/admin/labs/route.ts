// /app/api/admin/labs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // const labs = await prisma.lab.findMany({ include: { shellConfig: true } });
  const labs: any = [];
  return NextResponse.json(labs);
}

// Add POST, PUT, DELETE as needed, all with isAdmin check
