import { NextRequest, NextResponse } from "next/server";
import { labTaskRepository } from "@/services/labTaskService";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const labId = params.id;

  try {
    const tasks = await labTaskRepository.getTasksByLab(labId);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching lab tasks:", error);
    return NextResponse.json({ error: "Failed to fetch lab tasks" }, { status: 500 });
  }
}
