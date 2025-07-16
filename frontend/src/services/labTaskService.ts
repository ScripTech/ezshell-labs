import fsPromises from "fs/promises"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { db } from "@/db"
import { labTasks, labTaskProgress, labEnrollments } from "@/db/schemas/LabSchema"
import { nanoid } from "nanoid"
import { sql, eq, and } from "drizzle-orm"

// Use the base path for lab tasks storage from environment variable
const LAB_TASKS_BASE_PATH = process.env.LAB_TASKS_BASE_PATH || "unknown"

export type ImportedLabTasks = {
  tasks: Array<{
    order: number;
    title: string;
  }>
}

export async function importLabTasksFromMarkdown(
  labId: string,
  labFolder?: string
): Promise<ImportedLabTasks> {
  const folder = path.join(LAB_TASKS_BASE_PATH, labFolder ?? "");

  if (!fs.existsSync(folder ?? "")) {
    throw new Error(`Lab folder does not exist: ${labFolder}`);
  }

  const files = await fsPromises.readdir(folder);

  const labs: ImportedLabTasks = { tasks: [] };
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(folder, file);
    const content = await fsPromises.readFile(filePath, "utf8");
    const { data, content: markdown } = matter(content);

    // Avoid duplicate import: check if task with same labId and order exists
    const existing = await db
      .select()
      .from(labTasks)
      .where(and(eq(labTasks.labId, labId), eq(labTasks.order, data.order)))
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(labTasks).values({
      id: nanoid(),
      labId,
      order: data.order,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      points: data.points,
      hint: data.hint,
      validationSteps: data.validationSteps,
      markdown,
    });

    labs.tasks.push({
      order: data.order,
      title: data.title,
    });

  }

  return labs;
}

// Repository pattern for CRUD
export const labTaskRepository = {
  async getTasksByLab(labId: string) {
    return db.select().from(labTasks).where(sql`${labTasks.labId} = ${labId}`).orderBy(labTasks.order)
  },
  async getTaskById(id: string) {
    return db.select().from(labTasks).where(sql`${labTasks.id} = ${id}`).limit(1)
  },
  async createTask(task: any) {
    return db.insert(labTasks).values(task)
  },
  async updateTask(id: string, updates: any) {
    return db.update(labTasks).set(updates).where(sql`${labTasks.id} = ${id}`)
  },
  async deleteTask(id: string) {
    return db.delete(labTasks).where(sql`${labTasks.id} = ${id}`)
  },
}

// Service to get user progress for enrolled lab
export async function getUserLabTasksProgress(userId: string, labId: string) {
  // Get enrollment for user/lab
  const enrollment = await db.select().from(labEnrollments)
    .where(and(eq(labEnrollments.userId, userId), eq(labEnrollments.labId, labId)))
    .limit(1);

  if (!enrollment.length) return [];

  const enrollmentId = enrollment[0].id;

  // Get all tasks for lab
  const tasks = await db.select().from(labTasks).where(eq(labTasks.labId, labId)).orderBy(labTasks.order);

  // Get progress for each task for user/enrollment
  const progressRows = await db.select().from(labTaskProgress)
    .where(and(eq(labTaskProgress.userId, userId), eq(labTaskProgress.labEnrollmentId, enrollmentId)));

  // Merge tasks and progress
  return tasks.map(task => {
    const progress = progressRows.find(p => p.labTaskId === task.id);
    return {
      ...task,
      score: progress?.score ?? 0,
      completed: progress?.completed ?? false,
      completedAt: progress?.completedAt ?? null,
      progressId: progress?.id ?? null,
    };
  });
}

// Service to update user score for a task
export async function updateUserTaskScore({ userId, labTaskId, labEnrollmentId, score, completed }: {
  userId: string,
  labTaskId: string,
  labEnrollmentId: string,
  score: number,
  completed: boolean
}) {
  // Check if progress exists
  const existing = await db.select().from(labTaskProgress)
    .where(and(eq(labTaskProgress.userId, userId), eq(labTaskProgress.labTaskId, labTaskId), eq(labTaskProgress.labEnrollmentId, labEnrollmentId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing progress
    await db.update(labTaskProgress)
      .set({
        score,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .where(eq(labTaskProgress.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new progress
    const [row] = await db.insert(labTaskProgress)
      .values({
        id: nanoid(),
        userId,
        labTaskId,
        labEnrollmentId,
        score,
        completed,
        completedAt: completed ? new Date() : null,
        createdAt: new Date(),
      })
      .returning();
    return row.id;
  }
}
