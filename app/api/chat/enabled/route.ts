import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check for API key - support both environment variable names
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
    const enabled = !!apiKey

    return NextResponse.json({
      enabled,
      message: enabled
        ? "AI chat is available"
        : "AI chat requires GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable",
    })
  } catch (error) {
    console.error("❌ Error checking AI chat status:", error)
    return NextResponse.json({
      enabled: false,
      message: "Error checking AI chat availability",
    })
  }
}
