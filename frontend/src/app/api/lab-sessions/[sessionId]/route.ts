import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { labSessionService } from "@/services/labSessionService"

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()
    const { sessionId } = params

    let result
    switch (action) {
      case 'pause':
        result = await labSessionService.pauseSession(sessionId)
        break
      case 'resume':
        result = await labSessionService.resumeSession(sessionId)
        break
      case 'end':
        result = await labSessionService.endSession(sessionId, 'completed')
        break
      case 'abandon':
        result = await labSessionService.endSession(sessionId, 'abandoned')
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error managing lab session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage lab session" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = params
    const timeInfo = await labSessionService.getSessionTimeInfo(sessionId)

    return NextResponse.json(timeInfo)
  } catch (error) {
    console.error("Error getting session time info:", error)
    return NextResponse.json(
      { error: "Failed to get session time info" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = params
    await labSessionService.updateSessionActivity(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating session activity:", error)
    return NextResponse.json(
      { error: "Failed to update session activity" },
      { status: 500 }
    )
  }
}
