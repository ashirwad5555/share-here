import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history = [] } = body

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    // Use the latest stable model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    // Build conversation history for context
    let conversationContext = ""
    if (history.length > 0) {
      conversationContext =
        history
          .slice(-10) // Keep last 10 messages for context
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join("\n") + "\n"
    }

    // Create the prompt with context
    const prompt = `You are a helpful AI assistant integrated into a notes application. Be concise, friendly, and helpful. Here's the conversation history:

${conversationContext}

User: ${message}`

    // Generate response
    const response = await model.generateContent(prompt)
    const reply = response.response.text()

    return NextResponse.json({ success: true, reply }, { status: 200 })
  } catch (error) {
    console.error("Error generating response:", error)

    // Handle specific API errors
    if (error instanceof Error && error.message.includes("404")) {
      return NextResponse.json(
        {
          success: false,
          error: "The AI model is currently unavailable. Please try again later.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to generate response" }, { status: 500 })
  }
}
