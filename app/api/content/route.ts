import { type NextRequest, NextResponse } from "next/server"
import { verifySessionToken } from "@/lib/auth"
import { getUserEntries, createUserEntry, updateUserEntry, deleteUserEntry, getStorageInfo } from "@/lib/storage"

/**
 * GET /api/content
 * Returns user's entries
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from URL params for GET requests
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication token required" }, { status: 401 })
    }

    const session = verifySessionToken(token)
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    const entries = await getUserEntries(session.userId)
    const storageInfo = await getStorageInfo()

    console.log(`📖 User ${session.username} (ID: ${session.userId}) fetched ${entries.length} entries`)

    return NextResponse.json({
      success: true,
      entries,
      count: entries.length,
      lastModified: new Date().toISOString(),
      ...storageInfo,
    })
  } catch (error) {
    console.error("❌ GET /api/content error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/content
 * Creates a new entry for the user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, token, attachments } = body

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication token required" }, { status: 401 })
    }

    const session = verifySessionToken(token)
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 })
    }

    if (title.length > 100) {
      return NextResponse.json({ success: false, error: "Title too long (max 100 characters)" }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ success: false, error: "Content too long (max 5000 characters)" }, { status: 400 })
    }

    const entry = await createUserEntry(session.userId, title, content, attachments)

    console.log(`✅ User ${session.username} (ID: ${session.userId}) created entry: ${entry.title}`)

    return NextResponse.json({
      success: true,
      entry,
      message: "Entry created successfully",
    })
  } catch (error) {
    console.error("❌ POST /api/content error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/content
 * Updates an existing entry for the user
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, token, attachments } = body

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication token required" }, { status: 401 })
    }

    const session = verifySessionToken(token)
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    if (!id || !title || !content) {
      return NextResponse.json({ success: false, error: "ID, title, and content are required" }, { status: 400 })
    }

    if (title.length > 100) {
      return NextResponse.json({ success: false, error: "Title too long (max 100 characters)" }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ success: false, error: "Content too long (max 5000 characters)" }, { status: 400 })
    }

    const entry = await updateUserEntry(session.userId, id, title, content, attachments)

    if (!entry) {
      return NextResponse.json({ success: false, error: "Entry not found or access denied" }, { status: 404 })
    }

    console.log(`✅ User ${session.username} (ID: ${session.userId}) updated entry: ${entry.title}`)

    return NextResponse.json({
      success: true,
      entry,
      message: "Entry updated successfully",
    })
  } catch (error) {
    console.error("❌ PUT /api/content error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/content
 * Deletes an entry for the user
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, token } = body

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication token required" }, { status: 401 })
    }

    const session = verifySessionToken(token)
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Entry ID is required" }, { status: 400 })
    }

    const deleted = await deleteUserEntry(session.userId, id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Entry not found or access denied" }, { status: 404 })
    }

    console.log(`✅ User ${session.username} (ID: ${session.userId}) deleted entry: ${id}`)

    return NextResponse.json({
      success: true,
      message: "Entry deleted successfully",
    })
  } catch (error) {
    console.error("❌ DELETE /api/content error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
