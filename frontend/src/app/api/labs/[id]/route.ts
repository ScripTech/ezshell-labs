import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { labs, labEnrollments } from "@/db/schemas/LabSchema";
import { instructors } from "@/db/schemas/InstructorSchema";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First try with relations
    const lab = await db.query.labs.findFirst({
      where: eq(labs.id, params.id),
      with: {
        enrollments: {
          where: (enrollments, { eq }) => eq(enrollments.userId, userId),
        },
        instructor: true,
      },
    });

    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Transform the response to include enrollment status
    const enrollment = lab.enrollments?.[0];
    return NextResponse.json({
      ...lab,
      enrollments: undefined, // Remove raw enrollments data
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            progress: enrollment.progress,
            enrolledAt: enrollment.enrolledAt,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error fetching lab details:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab details" },
      { status: 500 }
    );
  }
}
