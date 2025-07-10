import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "content.json")

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

// Ensure data directory and file exist with proper error handling
async function ensureDataFile(): Promise<DataStructure> {
  try {
    const dataDir = path.dirname(DATA_FILE)

    // Create directory if it doesn't exist
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
      console.log("Created data directory:", dataDir)
    }

    // Try to read existing file
    try {
      const fileContent = await fs.readFile(DATA_FILE, "utf8")
      const parsedData = JSON.parse(fileContent)

      // Validate and fix data structure
      const validData: DataStructure = {
        entries: Array.isArray(parsedData.entries) ? parsedData.entries : [],
        lastModified: parsedData.lastModified || new Date().toISOString(),
      }

      return validData
    } catch (readError) {
      // File doesn't exist or is corrupted, create new one
      const initialData: DataStructure = {
        entries: [],
        lastModified: new Date().toISOString(),
      }

      await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8")
      console.log("Created new data file at:", DATA_FILE)
      return initialData
    }
  } catch (error) {
    console.error("Critical error in ensureDataFile:", error)
    // Return safe fallback
    return {
      entries: [],
      lastModified: new Date().toISOString(),
    }
  }
}

// Atomic write operation to prevent data corruption
async function writeDataSafely(data: DataStructure): Promise<void> {
  const tempFile = DATA_FILE + ".tmp"

  try {
    // Update timestamp
    data.lastModified = new Date().toISOString()

    // Write to temporary file first
    const jsonData = JSON.stringify(data, null, 2)
    await fs.writeFile(tempFile, jsonData, "utf8")

    // Atomic rename (replaces original file)
    await fs.rename(tempFile, DATA_FILE)

    console.log(`✅ Data successfully written to ${DATA_FILE} at ${data.lastModified}`)
    console.log(`📊 Total entries: ${data.entries.length}`)
  } catch (error) {
    console.error("❌ Error writing data:", error)

    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFile)
    } catch {
      // Ignore cleanup errors
    }

    throw new Error("Failed to save data to file")
  }
}

// GET - Read all entries
export async function GET() {
  try {
    console.log("📖 Reading data from file...")
    const data = await ensureDataFile()
    console.log(`✅ Retrieved ${data.entries.length} entries`)

    return NextResponse.json({
      success: true,
      ...data,
    })
  } catch (error) {
    console.error("❌ Error in GET:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read entries",
        entries: [],
        lastModified: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// POST - Create new entry
export async function POST(request: NextRequest) {
  try {
    console.log("📝 Creating new entry...")

    const body = await request.json()
    const { title, content } = body

    // Validate input
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Content is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    // Read current data
    const data = await ensureDataFile()

    // Create new entry
    const now = new Date().toISOString()
    const newEntry: TextEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    }

    // Add to beginning of array
    data.entries.unshift(newEntry)

    // Save to file
    await writeDataSafely(data)

    console.log(`✅ Created entry: "${newEntry.title}" (ID: ${newEntry.id})`)

    return NextResponse.json({
      success: true,
      entry: newEntry,
      message: "Entry created successfully",
    })
  } catch (error) {
    console.error("❌ Error in POST:", error)
    return NextResponse.json({ success: false, error: "Failed to create entry" }, { status: 500 })
  }
}

// PUT - Update existing entry
export async function PUT(request: NextRequest) {
  try {
    console.log("✏️ Updating entry...")

    const body = await request.json()
    const { id, title, content } = body

    // Validate input
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Valid ID is required" }, { status: 400 })
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Content is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    // Read current data
    const data = await ensureDataFile()

    // Find entry to update
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

    // Save to file
    await writeDataSafely(data)

    console.log(`✅ Updated entry: "${updatedEntry.title}" (ID: ${id})`)

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: "Entry updated successfully",
    })
  } catch (error) {
    console.error("❌ Error in PUT:", error)
    return NextResponse.json({ success: false, error: "Failed to update entry" }, { status: 500 })
  }
}

// DELETE - Delete entry
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Deleting entry...")

    const body = await request.json()
    const { id } = body

    // Validate input
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Valid ID is required" }, { status: 400 })
    }

    // Read current data
    const data = await ensureDataFile()

    // Find entry to delete
    const entryIndex = data.entries.findIndex((entry) => entry.id === id)

    if (entryIndex === -1) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
    }

    // Remove entry
    const deletedEntry = data.entries.splice(entryIndex, 1)[0]

    // Save to file
    await writeDataSafely(data)

    console.log(`✅ Deleted entry: "${deletedEntry.title}" (ID: ${id})`)

    return NextResponse.json({
      success: true,
      deletedEntry,
      message: "Entry deleted successfully",
    })
  } catch (error) {
    console.error("❌ Error in DELETE:", error)
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 })
  }
}
