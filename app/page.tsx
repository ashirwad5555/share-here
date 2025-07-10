"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Edit, Plus, Save, X, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

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
  success?: boolean
}

interface FormState {
  title: string
  content: string
  titleError: string
  contentError: string
  isSubmitting: boolean
}

export default function Component() {
  const [data, setData] = useState<DataStructure>({ entries: [], lastModified: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const [newEntry, setNewEntry] = useState<FormState>({
    title: "",
    content: "",
    titleError: "",
    contentError: "",
    isSubmitting: false,
  })

  const [editEntry, setEditEntry] = useState<FormState>({
    title: "",
    content: "",
    titleError: "",
    contentError: "",
    isSubmitting: false,
  })

  // Show notification helper
  const showNotification = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Validate form data
  const validateForm = (title: string, content: string) => {
    const errors = { titleError: "", contentError: "" }

    if (!title.trim()) {
      errors.titleError = "Title is required"
    } else if (title.trim().length < 2) {
      errors.titleError = "Title must be at least 2 characters"
    }

    if (!content.trim()) {
      errors.contentError = "Content is required"
    } else if (content.trim().length < 5) {
      errors.contentError = "Content must be at least 5 characters"
    }

    return errors
  }

  // Fetch all entries with better error handling
  const fetchEntries = useCallback(async () => {
    try {
      console.log("🔄 Fetching entries...")
      const response = await fetch("/api/content", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      const result = await response.json()

      if (result.success) {
        setData({
          entries: result.entries || [],
          lastModified: result.lastModified || new Date().toISOString(),
        })
        console.log(`✅ Loaded ${result.entries?.length || 0} entries`)
      } else {
        throw new Error(result.error || "Failed to fetch entries")
      }
    } catch (error) {
      console.error("❌ Error fetching entries:", error)
      showNotification("error", "Failed to load entries. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  // Create new entry with proper validation and loading states
  const createEntry = async () => {
    const errors = validateForm(newEntry.title, newEntry.content)

    if (errors.titleError || errors.contentError) {
      setNewEntry((prev) => ({ ...prev, ...errors }))
      return
    }

    setNewEntry((prev) => ({ ...prev, isSubmitting: true, titleError: "", contentError: "" }))

    try {
      console.log("📝 Creating new entry...")
      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newEntry.title.trim(),
          content: newEntry.content.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setNewEntry({
          title: "",
          content: "",
          titleError: "",
          contentError: "",
          isSubmitting: false,
        })
        await fetchEntries()
        showNotification("success", "Entry created successfully!")
        console.log("✅ Entry created:", result.entry.title)
      } else {
        throw new Error(result.error || "Failed to create entry")
      }
    } catch (error) {
      console.error("❌ Error creating entry:", error)
      showNotification("error", `Failed to create entry: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setNewEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Update entry with proper validation
  const updateEntry = async (id: string) => {
    const errors = validateForm(editEntry.title, editEntry.content)

    if (errors.titleError || errors.contentError) {
      setEditEntry((prev) => ({ ...prev, ...errors }))
      return
    }

    setEditEntry((prev) => ({ ...prev, isSubmitting: true, titleError: "", contentError: "" }))

    try {
      console.log("✏️ Updating entry...")
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          title: editEntry.title.trim(),
          content: editEntry.content.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setEditingId(null)
        setEditEntry({
          title: "",
          content: "",
          titleError: "",
          contentError: "",
          isSubmitting: false,
        })
        await fetchEntries()
        showNotification("success", "Entry updated successfully!")
        console.log("✅ Entry updated:", result.entry.title)
      } else {
        throw new Error(result.error || "Failed to update entry")
      }
    } catch (error) {
      console.error("❌ Error updating entry:", error)
      showNotification("error", `Failed to update entry: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setEditEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Delete entry with confirmation
  const deleteEntry = async (id: string) => {
    const entry = data.entries.find((e) => e.id === id)
    if (!entry) return

    if (!confirm(`Are you sure you want to delete "${entry.title}"?`)) return

    try {
      console.log("🗑️ Deleting entry...")
      const response = await fetch("/api/content", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchEntries()
        showNotification("success", "Entry deleted successfully!")
        console.log("✅ Entry deleted:", result.deletedEntry.title)
      } else {
        throw new Error(result.error || "Failed to delete entry")
      }
    } catch (error) {
      console.error("❌ Error deleting entry:", error)
      showNotification("error", `Failed to delete entry: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Start editing with proper state management
  const startEdit = (entry: TextEntry) => {
    setEditingId(entry.id)
    setEditEntry({
      title: entry.title,
      content: entry.content,
      titleError: "",
      contentError: "",
      isSubmitting: false,
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setEditEntry({
      title: "",
      content: "",
      titleError: "",
      contentError: "",
      isSubmitting: false,
    })
  }

  // Load data on component mount
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading your data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Notification */}
        {notification && (
          <Alert
            className={`mb-6 ${notification.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={notification.type === "success" ? "text-green-800" : "text-red-800"}>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Text Storage</h1>
          <p className="text-gray-600">Store and access your text content from anywhere in the world</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={fetchEntries} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {data.lastModified && (
              <p className="text-sm text-gray-500">Last updated: {new Date(data.lastModified).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Create New Entry */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Content
            </CardTitle>
            <CardDescription>Create a new text entry (automatically saved to data.json)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-title">Title *</Label>
              <Input
                id="new-title"
                placeholder="Enter title (minimum 2 characters)..."
                value={newEntry.title}
                onChange={(e) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    title: e.target.value,
                    titleError: "",
                  }))
                }
                className={newEntry.titleError ? "border-red-500" : ""}
                disabled={newEntry.isSubmitting}
              />
              {newEntry.titleError && <p className="text-red-500 text-sm mt-1">{newEntry.titleError}</p>}
            </div>
            <div>
              <Label htmlFor="new-content">Content *</Label>
              <Textarea
                id="new-content"
                placeholder="Enter your content (minimum 5 characters)..."
                rows={4}
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    content: e.target.value,
                    contentError: "",
                  }))
                }
                className={newEntry.contentError ? "border-red-500" : ""}
                disabled={newEntry.isSubmitting}
              />
              {newEntry.contentError && <p className="text-red-500 text-sm mt-1">{newEntry.contentError}</p>}
            </div>
            <Button onClick={createEntry} className="w-full" disabled={newEntry.isSubmitting}>
              {newEntry.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-4">
          {data.entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No entries found. Create your first entry above!</p>
              </CardContent>
            </Card>
          ) : (
            data.entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingId === entry.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editEntry.title}
                            onChange={(e) =>
                              setEditEntry((prev) => ({
                                ...prev,
                                title: e.target.value,
                                titleError: "",
                              }))
                            }
                            className={`text-lg font-semibold ${editEntry.titleError ? "border-red-500" : ""}`}
                            placeholder="Enter title..."
                            disabled={editEntry.isSubmitting}
                          />
                          {editEntry.titleError && <p className="text-red-500 text-sm">{editEntry.titleError}</p>}
                        </div>
                      ) : (
                        <CardTitle className="text-lg">{entry.title}</CardTitle>
                      )}
                      <CardDescription>
                        Created: {new Date(entry.createdAt).toLocaleString()}
                        {entry.updatedAt !== entry.createdAt && (
                          <span className="ml-2">• Updated: {new Date(entry.updatedAt).toLocaleString()}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {editingId === entry.id ? (
                        <>
                          <Button size="sm" onClick={() => updateEntry(entry.id)} disabled={editEntry.isSubmitting}>
                            {editEntry.isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} disabled={editEntry.isSubmitting}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === entry.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editEntry.content}
                        onChange={(e) =>
                          setEditEntry((prev) => ({
                            ...prev,
                            content: e.target.value,
                            contentError: "",
                          }))
                        }
                        rows={4}
                        className={editEntry.contentError ? "border-red-500" : ""}
                        placeholder="Enter content..."
                        disabled={editEntry.isSubmitting}
                      />
                      {editEntry.contentError && <p className="text-red-500 text-sm">{editEntry.contentError}</p>}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">{entry.content}</div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
