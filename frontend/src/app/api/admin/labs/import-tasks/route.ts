import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { isAdmin, authOptions } from "@/lib/auth";
import { importLabTasksFromMarkdown } from "@/services/labTaskService";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { labId, labFolder } = await req.json();
  if (!labId || !labFolder) {
    return NextResponse.json({ error: "Missing labId or labFolder" }, { status: 400 });
  }

  try {
    const labTasks = await importLabTasksFromMarkdown(labId, labFolder);
    return NextResponse.json({
      success: true,
      labTasks: labTasks,
      message:
        labTasks.tasks.length == 0
          ? "No tasks or new tasks imported"
          : `${labTasks.tasks.length} tasks Imported`,
    });
  } catch (err) {
    console.error("Error importing lab tasks:", err);
    return NextResponse.json({ error: "Failed to import lab tasks" }, { status: 500 });
  }
}
