import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { labEnrollments, labs } from "@/db/schemas/LabSchema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",") ?? [];
  if (!ids.length) return NextResponse.json([]);
  const enrollments = await db.select().from(labEnrollments).where(sql`{labEnrollments.id in (${sql.join(ids.map(id => sql`${id}`), ", ")})}`);
  const labIds = enrollments.map(e => e.labId);
  const labsData = await db.select().from(labs).where(sql`{labs.id in (${sql.join(labIds.map(id => sql`${id}`), ", ")})}`);
  const result = enrollments.map(e => ({
    enrollmentId: e.id,
    labName: labsData.find(l => l.id === e.labId)?.name ?? "",
  }));
  return NextResponse.json(result);
}
