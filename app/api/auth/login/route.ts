import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, createSessionToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validate input
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    // Authenticate user
    const user = await authenticateUser(username.trim(), password)

    if (!user) {
      // Add a small delay to prevent brute force attacks
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    }

    // Create session token
    const token = createSessionToken(user)

    console.log(`✅ User logged in: ${user.username} (${user.role})`)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
