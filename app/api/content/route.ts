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

// ---------------------------------------------------------------------------
// Detect whether Vercel KV is configured.  If not, we transparently fall back
// to an in-memory store so the app works in local / preview environments.
// ---------------------------------------------------------------------------
const isKVAvailable = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

const STORAGE_KEY = "global-text-storage"

// In-memory fallback storage for preview/development
let memoryStore: DataStructure = {
  entries: [
    {
      id: "demo-welcome",
      title: "🌍 Welcome to Global Text Storage!",
      content:
        "This is a demo entry showing how the app works.\n\n✅ In PREVIEW: Data is stored temporarily in memory\n✅ When DEPLOYED: Data is stored globally in Vercel KV database\n\nTry creating, editing, or deleting entries below!",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo-features",
      title: "📱 Mobile-Optimized Features",
      content:
        "• Touch-friendly interface\n• Responsive design for all screen sizes\n• Share button with native mobile sharing\n• PWA support for app-like experience\n• Fast loading and smooth animations\n• Works offline when installed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  lastModified: new Date().toISOString(),
}

// Data access functions with automatic fallback
async function getData(): Promise<DataStructure> {
  if (isKVAvailable()) {
    try {
      // Dynamic import to avoid errors when KV isn't available
      const { kv } = await import("@vercel/kv")
      const data = await kv.get<DataStructure>(STORAGE_KEY)

      if (!data || !Array.isArray(data.entries)) {
        // Initialize KV with demo data if empty
        const initialData: DataStructure = {
          entries: [
            {
              id: "global-welcome",
              title: "🌍 Global Database Active!",
              content:
                "Congratulations! Your Vercel KV database is now active.\n\n✅ This data is shared globally\n✅ Everyone sees the same content\n✅ Changes sync in real-time\n✅ Data persists forever\n\nYou can now share your URL with anyone!",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          lastModified: new Date().toISOString(),
        }
        await kv.set(STORAGE_KEY, initialData)
        return initialData
      }
      return data
    } catch (error) {
      console.error("❌ KV Error, falling back to memory:", error)
      return memoryStore
    }
  }

  // Fallback to memory store
  return memoryStore
}

async function saveData(data: DataStructure): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import("@vercel/kv")
      await kv.set(STORAGE_KEY, data)
      console.log("✅ Data saved to Vercel KV")
    } catch (error) {
      console.error("❌ KV Save Error, using memory:", error)
      memoryStore = data
    }
  } else {
    memoryStore = data
  }
}

// GET - Read all entries
export async function GET() {
  try {
    const storageType = isKVAvailable() ? "vercel-kv" : "memory-preview"
    console.log(`📖 GET request - using ${storageType}`)

    const data = await getData()

    console.log(`✅ Loaded ${data.entries.length} entries from ${storageType}`)

    return NextResponse.json(
      {
        success: true,
        entries: data.entries,
        lastModified: data.lastModified,
        count: data.entries.length,
        storage: storageType,
        isGlobal: isKVAvailable(),
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
        storage: "error",
        isGlobal: false,
      },
      { status: 500 },
    )
  }
}

// POST - Create new entry
export async function POST(request: NextRequest) {
  try {
    const storageType = isKVAvailable() ? "vercel-kv" : "memory-preview"
    console.log(`📝 POST request - using ${storageType}`)

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { title, content } = body

    // Validate input
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 })
    }

    // Get current data
    const data = await getData()

    // Create new entry
    const newEntry: TextEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to beginning
    data.entries.unshift(newEntry)
    data.lastModified = new Date().toISOString()

    // Save data
    await saveData(data)

    console.log(`✅ Created entry: "${newEntry.title}"`)

    return NextResponse.json({
      success: true,
      entry: newEntry,
      message: "Entry created successfully",
      totalEntries: data.entries.length,
      storage: storageType,
      isGlobal: isKVAvailable(),
    })
  } catch (error) {
    console.error("❌ POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to create entry" }, { status: 500 })
  }
}

// PUT - Update entry
export async function PUT(request: NextRequest) {
  try {
    const storageType = isKVAvailable() ? "vercel-kv" : "memory-preview"
    console.log(`✏️ PUT request - using ${storageType}`)

    const body = await request.json()
    const { id, title, content } = body

    if (!id || !title?.trim() || !content?.trim()) {
      return NextResponse.json({ success: false, error: "ID, title, and content are required" }, { status: 400 })
    }

    const data = await getData()
    const entryIndex = data.entries.findIndex((entry) => entry.id === id)

    if (entryIndex === -1) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
    }

    // Update entry
    const updatedEntry = {
      ...data.entries[entryIndex],
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    }

    data.entries[entryIndex] = updatedEntry
    data.lastModified = new Date().toISOString()

    await saveData(data)

    console.log(`✅ Updated entry: "${updatedEntry.title}"`)

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: "Entry updated successfully",
      storage: storageType,
      isGlobal: isKVAvailable(),
    })
  } catch (error) {
    console.error("❌ PUT error:", error)
    return NextResponse.json({ success: false, error: "Failed to update entry" }, { status: 500 })
  }
}

// DELETE - Delete entry
export async function DELETE(request: NextRequest) {
  try {
    const storageType = isKVAvailable() ? "vercel-kv" : "memory-preview"
    console.log(`🗑️ DELETE request - using ${storageType}`)

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const data = await getData()
    const entryIndex = data.entries.findIndex((entry) => entry.id === id)

    if (entryIndex === -1) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
    }

    const deletedEntry = data.entries.splice(entryIndex, 1)[0]
    data.lastModified = new Date().toISOString()

    await saveData(data)

    console.log(`✅ Deleted entry: "${deletedEntry.title}"`)

    return NextResponse.json({
      success: true,
      deletedEntry,
      message: "Entry deleted successfully",
      remainingEntries: data.entries.length,
      storage: storageType,
      isGlobal: isKVAvailable(),
    })
  } catch (error) {
    console.error("❌ DELETE error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 })
  }
}
