import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { isAdmin, authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labs } from "@/db/schemas/LabSchema";
import { z } from "zod";
import { sql } from "drizzle-orm";

const labSchema = z.object({
  name: z.string().min(3).max(100),
  labId: z.string().min(3).max(50),
  description: z.string().min(10).max(5000),
  duration: z.number().int().min(10).max(240),
  imageUrl: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = params.id;
  try {
    // const lab = await db.select().from(labs).where(labs.id.eq(id)).limit(1);
    const lab = await db
      .select()
      .from(labs)
      .where(sql`${labs.id} = ${id}`)
      .limit(1);
    if (!lab.length) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }
    return NextResponse.json(lab[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lab" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const id = params.id;
  const body = await req.json();
  const result = labSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 });
  }

  try {
    await db
      .update(labs)
      .set({
        name: result.data.name,
        labId: result.data.labId,
        description: result.data.description,
        duration: result.data.duration,
        imageUrl: result.data.imageUrl ?? "",
      })
      .where(sql`${labs.id} = ${id}`)
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lab" }, { status: 500 });
  }
}
