import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { labSessionService } from "@/services/labSessionService"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { labId } = await request.json()

    if (!labId) {
      return NextResponse.json({ error: "Lab ID is required" }, { status: 400 })
    }

    const labSession = await labSessionService.startLabSession(session.user.id, labId)

    return NextResponse.json(labSession)
  } catch (error) {
    console.error("Error starting lab session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start lab session" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const labId = searchParams.get("labId")

    if (!labId) {
      return NextResponse.json({ error: "Lab ID is required" }, { status: 400 })
    }

    const activeSession = await labSessionService.getActiveSession(session.user.id, labId)

    return NextResponse.json(activeSession)
  } catch (error) {
    console.error("Error getting active session:", error)
    return NextResponse.json(
      { error: "Failed to get active session" },
      { status: 500 }
    )
  }
}
