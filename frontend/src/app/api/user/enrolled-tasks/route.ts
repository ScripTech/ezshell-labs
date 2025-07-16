import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labTaskProgress, labTasks, labEnrollments } from "@/db/schemas/LabSchema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all enrollments for user
  const enrollments = await db.select().from(labEnrollments).where(eq(labEnrollments.userId, userId));
  const enrollmentIds = enrollments.map(e => e.id);

  // Get all lab task progress for user
  const progressRows = await db.select().from(labTaskProgress)
    .where(eq(labTaskProgress.userId, userId));

  // Get all lab tasks for enrolled labs
  const labIds = enrollments.map(e => e.labId);
  const tasks = labIds.length
    ? await db
        .select()
        .from(labTasks)
        .where(sql`${labTasks.labId} IN ${labIds}`)
    : [];
  // Merge progress with tasks
  const result = tasks.map(task => {
    const progress = progressRows.find(p => p.labTaskId === task.id);
    return {
      id: task.id,
      lab: task.labId,
      enrollmentId: (enrollments.find(e => e.labId === task.labId)?.id) || null,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      score: progress?.score ?? 0,
      completed: progress?.completed ?? false,
      completionTime: progress?.completedAt ? "10 min" : "-", // Replace with actual time logic later
      topPosition: "-", // Replace with leaderboard logic later
    };
  });

  return NextResponse.json(result);
}
