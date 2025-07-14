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
    await importLabTasksFromMarkdown(labId, labFolder);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error importing lab tasks:", err);
    return NextResponse.json({ error: "Failed to import lab tasks" }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const labId = req.nextUrl.searchParams.get("labId");
  const labFolder = req.nextUrl.searchParams.get("labFolder");
  if (!labId || !labFolder) {
    return NextResponse.json({ error: "Missing labId or labFolder" }, { status: 400 });
  }

  try {
    const labTasks = await importLabTasksFromMarkdown(labId, labFolder);
    console.log(`Imported lab tasks for ${labId} from ${labFolder}`);
    return NextResponse.json({
      success: true,
      labTasks: labTasks,
      message: labTasks.tasks.length == 0 ? "No tasks or new tasks imported" : `${labTasks.tasks.length} tasks Imported`,
    });
  } catch (err: any) {
    console.error("Error importing lab tasks:", err);
    return NextResponse.json(
      { error: "Failed to import lab tasks", details: err.message },
      { status: 500 }
    );
  }
}
