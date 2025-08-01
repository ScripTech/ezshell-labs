import { NextRequest, NextResponse } from "next/server";
import { labTaskRepository } from "@/services/labTaskService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { taskId } = params;

  try {
    const task = await labTaskRepository.getTaskById(taskId);
    if (!task.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task[0]);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { taskId } = params;
  const session = await getServerSession(authOptions);

  // Only admins can edit tasks
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await labTaskRepository.updateTask(taskId, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { taskId } = params;
  const session = await getServerSession(authOptions);

  // Only admins can change task status
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, isEnabled, maintenanceMessage } = body;

    await labTaskRepository.updateTaskStatus(taskId, status, isEnabled, maintenanceMessage);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const { taskId } = params;
  const session = await getServerSession(authOptions);

  // Only admins can delete tasks
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await labTaskRepository.deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
