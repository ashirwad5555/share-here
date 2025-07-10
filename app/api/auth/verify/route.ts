import { type NextRequest, NextResponse } from "next/server"
import { verifySessionToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    const session = verifySessionToken(token)

    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        username: session.username,
        name: session.name,
        role: session.role,
      },
    })
  } catch (error) {
    console.error("❌ Token verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
