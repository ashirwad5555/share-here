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
}

// Ensure data directory and file exist
async function ensureDataFile(): Promise<DataStructure> {
  try {
    const dataDir = path.dirname(DATA_FILE)
    await fs.mkdir(dataDir, { recursive: true })

    try {
      const data = await fs.readFile(DATA_FILE, "utf8")
      return JSON.parse(data)
    } catch {
      // File doesn't exist, create it
      const initialData: DataStructure = { entries: [] }
      await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2))
      return initialData
    }
  } catch (error) {
    console.error("Error ensuring data file:", error)
    return { entries: [] }
  }
}

// Read data from file
async function readData(): Promise<DataStructure> {
  return await ensureDataFile()
}

// Write data to file
async function writeData(data: DataStructure): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error("Error writing data:", error)
    throw error
  }
}

// GET - Read all entries
export async function GET() {
  try {
    const data = await readData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to read entries" }, { status: 500 })
  }
}

// POST - Create new entry
export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const data = await readData()
    const newEntry: TextEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    data.entries.unshift(newEntry) // Add to beginning of array
    await writeData(data)

    return NextResponse.json({ success: true, entry: newEntry })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 })
  }
}

// PUT - Update existing entry
export async function PUT(request: NextRequest) {
  try {
    const { id, title, content } = await request.json()

    if (!id || !title || !content) {
      return NextResponse.json({ error: "ID, title, and content are required" }, { status: 400 })
    }

    const data = await readData()
    const entryIndex = data.entries.findIndex((entry) => entry.id === id)

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    data.entries[entryIndex] = {
      ...data.entries[entryIndex],
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    }

    await writeData(data)

    return NextResponse.json({ success: true, entry: data.entries[entryIndex] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
  }
}

// DELETE - Delete entry
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const data = await readData()
    const entryIndex = data.entries.findIndex((entry) => entry.id === id)

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const deletedEntry = data.entries.splice(entryIndex, 1)[0]
    await writeData(data)

    return NextResponse.json({ success: true, deletedEntry })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
  }
}
