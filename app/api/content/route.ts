import { type NextRequest, NextResponse } from "next/server"

interface TextEntry {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface DataStructure {
  entries: TextEntry[]
  lastModified: string
}

// Global in-memory storage that persists across requests
let globalStorage: DataStructure = {
  entries: [
    {
      id: "demo-1",
      title: "Welcome to Global Text Storage",
      content:
        "This is a demo entry to show how the app works. You can edit or delete this entry, and create new ones. Data is stored in memory during your session.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  lastModified: new Date().toISOString(),
}

// Helper to ensure data structure is valid
function validateAndFixData(data: any): DataStructure {
  if (!data || typeof data !== "object") {
    return globalStorage
  }

  return {
    entries: Array.isArray(data.entries) ? data.entries : [],
    lastModified: data.lastModified || new Date().toISOString(),
  }
}

// GET - Read all entries
export async function GET() {
  try {
    console.log("📖 GET request - returning", globalStorage.entries.length, "entries")

    return NextResponse.json(
      {
        success: true,
        entries: globalStorage.entries,
        lastModified: globalStorage.lastModified,
        count: globalStorage.entries.length,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("❌ GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read data",
        entries: [],
        lastModified: new Date().toISOString(),
        count: 0,
      },
      { status: 500 },
    )
  }
}

// POST - Create new entry
export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST request received")

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    const { title, content } = body

    // Validate input with detailed messages
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required and must be a non-empty string",
        },
        { status: 400 },
      )
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Content is required and must be a non-empty string",
        },
        { status: 400 },
      )
    }

    // Ensure global storage is valid
    globalStorage = validateAndFixData(globalStorage)

    // Create new entry with guaranteed unique ID
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const newEntry: TextEntry = {
      id: `entry-${timestamp}-${randomSuffix}`,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to beginning of array
    globalStorage.entries.unshift(newEntry)
    globalStorage.lastModified = new Date().toISOString()

    console.log(`✅ Created entry: "${newEntry.title}" (ID: ${newEntry.id})`)
    console.log(`📊 Total entries: ${globalStorage.entries.length}`)

    return NextResponse.json({
      success: true,
      entry: newEntry,
      message: "Entry created successfully",
      totalEntries: globalStorage.entries.length,
    })
  } catch (error) {
    console.error("❌ POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

// PUT - Update entry
export async function PUT(request: NextRequest) {
  try {
    console.log("✏️ PUT request received")

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    const { id, title, content } = body

    // Validate input
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Valid ID is required",
        },
        { status: 400 },
      )
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required and must be a non-empty string",
        },
        { status: 400 },
      )
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Content is required and must be a non-empty string",
        },
        { status: 400 },
      )
    }

    // Ensure global storage is valid
    globalStorage = validateAndFixData(globalStorage)

    // Find entry
    const entryIndex = globalStorage.entries.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: `Entry with ID "${id}" not found`,
        },
        { status: 404 },
      )
    }

    // Update entry
    const updatedEntry = {
      ...globalStorage.entries[entryIndex],
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    }

    globalStorage.entries[entryIndex] = updatedEntry
    globalStorage.lastModified = new Date().toISOString()

    console.log(`✅ Updated entry: "${updatedEntry.title}" (ID: ${id})`)

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: "Entry updated successfully",
    })
  } catch (error) {
    console.error("❌ PUT error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

// DELETE - Delete entry
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ DELETE request received")

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    const { id } = body

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Valid ID is required",
        },
        { status: 400 },
      )
    }

    // Ensure global storage is valid
    globalStorage = validateAndFixData(globalStorage)

    // Find and remove entry
    const entryIndex = globalStorage.entries.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: `Entry with ID "${id}" not found`,
        },
        { status: 404 },
      )
    }

    const deletedEntry = globalStorage.entries.splice(entryIndex, 1)[0]
    globalStorage.lastModified = new Date().toISOString()

    console.log(`✅ Deleted entry: "${deletedEntry.title}" (ID: ${id})`)
    console.log(`📊 Remaining entries: ${globalStorage.entries.length}`)

    return NextResponse.json({
      success: true,
      deletedEntry,
      message: "Entry deleted successfully",
      remainingEntries: globalStorage.entries.length,
    })
  } catch (error) {
    console.error("❌ DELETE error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
