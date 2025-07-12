// /app/api/admin/labs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin, authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labs } from "@/db/schemas/LabSchema";
import { z } from "zod";

const labSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(5000),
  duration: z.number().int().min(10).max(240),
  imageUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // const labs = await prisma.lab.findMany({ include: { shellConfig: true } });
  const labs: any = [];
  return NextResponse.json(labs);
}

// Add POST, PUT, DELETE as needed, all with isAdmin check

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const result = labSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 });
  }

  try {
    const lab = await db.insert(labs).values({
      id: crypto.randomUUID(),
      name: result.data.name,
      description: result.data.description,
      duration: result.data.duration,
      imageUrl: result.data.imageUrl ?? "",
    }).returning();

    return NextResponse.json(lab[0]);
  } catch (error) {
    console.error("Error creating lab:", error);
    return NextResponse.json({ error: "Failed to create lab" }, { status: 500 });
  }
}
