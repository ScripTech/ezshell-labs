import { NextRequest, NextResponse } from "next/server";
import { labTaskRepository } from "@/services/labTaskService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const labId = params.id;
  const session = await getServerSession(authOptions);

  try {
    let tasks;

    // Check if user is admin - show all tasks including disabled ones
    if (session?.user?.role === 'admin') {
      tasks = await labTaskRepository.getTasksByLab(labId);
    } else {
      // For regular users, only show enabled and active tasks
      tasks = await labTaskRepository.getEnabledTasksByLab(labId);
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching lab tasks:", error);
    return NextResponse.json({ error: "Failed to fetch lab tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const labId = params.id;
  const session = await getServerSession(authOptions);

  // Only admins can create tasks
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const taskData = {
      ...body,
      labId,
      id: `task-${Date.now()}`, // Generate a unique ID
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await labTaskRepository.createTask(taskData);
    return NextResponse.json({ success: true, task: taskData });
  } catch (error) {
    console.error("Error creating lab task:", error);
    return NextResponse.json({ error: "Failed to create lab task" }, { status: 500 });
  }
}
