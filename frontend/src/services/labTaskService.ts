import fsPromises from "fs/promises"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { db } from "@/db"
import { labTasks, labTaskProgress } from "@/db/schemas/LabSchema"
import { nanoid } from "nanoid"
import { sql } from "drizzle-orm"

// Use the base path for lab tasks storage from environment variable
const LAB_TASKS_BASE_PATH = process.env.LAB_TASKS_BASE_PATH || "unknown"

export async function importLabTasksFromMarkdown(labId: string, labFolder?: string) {
  const folder = path.join(LAB_TASKS_BASE_PATH, labId);

  // If labFolder not provided, use the default base path
  if (!fs.existsSync(folder ?? "")) {
    throw new Error(`Lab folder does not exist: ${labFolder}`);
  }

  const files = await fsPromises.readdir(folder);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(folder, file);
    const content = await fsPromises.readFile(filePath, "utf8");
    const { data, content: markdown } = matter(content);
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
  }
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
  // Get enrollment
  // ...get enrollmentId for user/lab...
  // Get all tasks for lab
  // Get progress for each task for user/enrollment
  // Return array of { task, progress }
}

// Service to update user score for a task
export async function updateUserTaskScore({ userId, labTaskId, labEnrollmentId, score, completed }: {
  userId: string,
  labTaskId: string,
  labEnrollmentId: string,
  score: number,
  completed: boolean
}) {
  // Upsert logic for labTaskProgress
  // ...
}
