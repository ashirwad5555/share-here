import { type NextRequest, NextResponse } from "next/server"
import { verifySessionToken } from "@/lib/auth"
import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, token } = body

    // Verify authentication
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const session = verifySessionToken(token)
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    // Check if message is provided
    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    // Check for API key - support both environment variable names
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI chat is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY to environment variables.",
        },
        { status: 503 },
      )
    }

    console.log(
      `🤖 AI Chat request from user ${session.username} (ID: ${session.userId}): ${message.substring(0, 50)}...`,
    )

    // Create Google provider with explicit API key
    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    })

    // Generate response using Gemini
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `You are a helpful AI assistant for a personal notes application. The user ${session.name} is asking: ${message}

Please provide a helpful, concise response. If they're asking about note-taking, organization, or productivity, provide specific advice. Keep responses under 200 words unless more detail is specifically requested.`,
      maxTokens: 300,
    })

    console.log(`✅ AI response generated for user ${session.username}`)

    return NextResponse.json({
      success: true,
      response: text,
    })
  } catch (error) {
    console.error("❌ AI Chat error:", error)

    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY configuration.",
          },
          { status: 503 },
        )
      }

      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json(
          {
            success: false,
            error: "API quota exceeded. Please try again later.",
          },
          { status: 429 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "AI service temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    )
  }
}
