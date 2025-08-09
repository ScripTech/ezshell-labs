// /app/api/admin/labs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin, authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labs } from "@/db/schemas/LabSchema";
import { z } from "zod";

const labSchema = z.object({
  name: z.string().min(3).max(100),
  labId: z.string().min(3).max(50),
  description: z.string().min(10).max(5000),
  duration: z.number().int().min(10).max(240),
  imageUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("Session:", session);
  console.log("User role:", session?.user?.role);
  console.log("Is admin:", isAdmin(session));

  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const allLabs = await db.query.labs.findMany({
      with: {
        instructor: true,
      },
    });
    return NextResponse.json(allLabs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    return NextResponse.json({ error: "Failed to fetch labs" }, { status: 500 });
  }
}

// Add POST, PUT, DELETE as needed, all with isAdmin check

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const result = labSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Form Validation failed! Invalid data", issues: result.error.issues }, { status: 400 });
  }

  try {
    const lab = await db.insert(labs).values({
      id: crypto.randomUUID(),
      labId: result.data.labId,
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
