import { kv } from "@vercel/kv"

export interface FileAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  data: string // base64 encoded file data
  uploadedAt: string
}

export interface TextEntry {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  userId: string
  attachments?: FileAttachment[]
}

// In-memory storage as fallback
const memoryStorage = new Map<string, TextEntry[]>()

// Get user-specific storage key
function getUserStorageKey(userId: string): string {
  return `user:${userId}:notes`
}

// Get entries for a specific user
export async function getUserEntries(userId: string): Promise<TextEntry[]> {
  const storageKey = getUserStorageKey(userId)

  try {
    // Try Vercel KV first
    const kvEntries = await kv.get<TextEntry[]>(storageKey)
    if (kvEntries) {
      return kvEntries.filter((entry) => entry.userId === userId) // Double-check user isolation
    }
  } catch (error) {
    console.log("KV not available, using memory storage")
  }

  // Fallback to memory storage
  return memoryStorage.get(storageKey) || []
}

// Save entries for a specific user
export async function saveUserEntries(userId: string, entries: TextEntry[]): Promise<void> {
  const storageKey = getUserStorageKey(userId)

  // Ensure all entries belong to this user
  const userEntries = entries.filter((entry) => entry.userId === userId)

  try {
    // Try Vercel KV first
    await kv.set(storageKey, userEntries)
  } catch (error) {
    console.log("KV not available, using memory storage")
    // Fallback to memory storage
    memoryStorage.set(storageKey, userEntries)
  }
}

// Create a new entry for a user
export async function createUserEntry(
  userId: string,
  title: string,
  content: string,
  attachments?: FileAttachment[],
): Promise<TextEntry> {
  const entries = await getUserEntries(userId)

  const newEntry: TextEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: userId,
    attachments: attachments || [],
  }

  const updatedEntries = [newEntry, ...entries]
  await saveUserEntries(userId, updatedEntries)

  return newEntry
}

// Update an entry for a user
export async function updateUserEntry(
  userId: string,
  id: string,
  title: string,
  content: string,
  attachments?: FileAttachment[],
): Promise<TextEntry | null> {
  const entries = await getUserEntries(userId)
  const entryIndex = entries.findIndex((entry) => entry.id === id && entry.userId === userId)

  if (entryIndex === -1) {
    return null
  }

  const updatedEntry: TextEntry = {
    ...entries[entryIndex],
    title: title.trim(),
    content: content.trim(),
    updatedAt: new Date().toISOString(),
    attachments: attachments !== undefined ? attachments : entries[entryIndex].attachments,
  }

  entries[entryIndex] = updatedEntry
  await saveUserEntries(userId, entries)

  return updatedEntry
}

// Delete an entry for a user
export async function deleteUserEntry(userId: string, id: string): Promise<boolean> {
  const entries = await getUserEntries(userId)
  const entryIndex = entries.findIndex((entry) => entry.id === id && entry.userId === userId)

  if (entryIndex === -1) {
    return false // Entry not found or doesn't belong to user
  }

  entries.splice(entryIndex, 1)
  await saveUserEntries(userId, entries)

  return true
}

// Check if storage is using KV or memory
export async function getStorageInfo(): Promise<{ isGlobal: boolean; storage: string }> {
  try {
    await kv.ping()
    return { isGlobal: true, storage: "vercel-kv" }
  } catch (error) {
    return { isGlobal: false, storage: "memory" }
  }
}
