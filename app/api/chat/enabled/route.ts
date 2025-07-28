import { NextResponse } from "next/server"

export async function GET() {
  const enabled = !!process.env.GEMINI_API_KEY
  return NextResponse.json({ enabled })
}
