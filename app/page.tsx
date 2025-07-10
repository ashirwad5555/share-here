"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Trash2,
  Edit,
  Plus,
  Save,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Smartphone,
} from "lucide-react"

interface TextEntry {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  entries?: TextEntry[]
  entry?: TextEntry
  lastModified?: string
  count?: number
  totalEntries?: number
  remainingEntries?: number
  deletedEntry?: TextEntry
  message?: string
  error?: string
}

interface FormState {
  title: string
  content: string
  titleError: string
  contentError: string
  isSubmitting: boolean
}

export default function Component() {
  const [data, setData] = useState<{ entries: TextEntry[]; lastModified: string; count: number }>({
    entries: [],
    lastModified: "",
    count: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info"
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

  // Show notification helper with auto-dismiss
  const showNotification = useCallback((type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), type === "error" ? 8000 : 5000)
  }, [])

  // Validate form data with mobile-friendly messages
  const validateForm = (title: string, content: string) => {
    const errors = { titleError: "", contentError: "" }

    if (!title.trim()) {
      errors.titleError = "Please enter a title"
    } else if (title.trim().length < 2) {
      errors.titleError = "Title needs at least 2 characters"
    } else if (title.trim().length > 100) {
      errors.titleError = "Title is too long (max 100 characters)"
    }

    if (!content.trim()) {
      errors.contentError = "Please enter some content"
    } else if (content.trim().length < 5) {
      errors.contentError = "Content needs at least 5 characters"
    } else if (content.trim().length > 5000) {
      errors.contentError = "Content is too long (max 5000 characters)"
    }

    return errors
  }

  // Enhanced fetch with better mobile error handling
  const fetchEntries = useCallback(async () => {
    try {
      console.log("🔄 Fetching entries...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/content", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.entries) {
        setData({
          entries: result.entries,
          lastModified: result.lastModified || new Date().toISOString(),
          count: result.count || result.entries.length,
        })
        console.log(`✅ Loaded ${result.entries.length} entries`)

        if (result.entries.length === 0) {
          showNotification("info", "No entries yet. Create your first one below!")
        }
      } else {
        throw new Error(result.error || "Failed to load entries")
      }
    } catch (error) {
      console.error("❌ Error fetching entries:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          showNotification("error", "Request timed out. Please check your connection and try again.")
        } else if (error.message.includes("Network")) {
          showNotification("error", "Network error. Please check your internet connection.")
        } else {
          showNotification("error", `Failed to load: ${error.message}`)
        }
      } else {
        showNotification("error", "Something went wrong. Please try refreshing the page.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  // Enhanced create entry with mobile optimizations
  const createEntry = async () => {
    const errors = validateForm(newEntry.title, newEntry.content)

    if (errors.titleError || errors.contentError) {
      setNewEntry((prev) => ({ ...prev, ...errors }))
      // Scroll to first error on mobile
      const firstError = errors.titleError ? "new-title" : "new-content"
      document.getElementById(firstError)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setNewEntry((prev) => ({ ...prev, isSubmitting: true, titleError: "", contentError: "" }))

    try {
      console.log("📝 Creating new entry...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for creation

      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newEntry.title.trim(),
          content: newEntry.content.trim(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.entry) {
        // Clear form
        setNewEntry({
          title: "",
          content: "",
          titleError: "",
          contentError: "",
          isSubmitting: false,
        })

        // Refresh data
        await fetchEntries()

        showNotification("success", `"${result.entry.title}" created successfully!`)
        console.log("✅ Entry created:", result.entry.title)

        // Scroll to top to see the new entry on mobile
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        throw new Error(result.error || "Failed to create entry")
      }
    } catch (error) {
      console.error("❌ Error creating entry:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          showNotification("error", "Creation timed out. Please try again.")
        } else {
          showNotification("error", `Failed to create: ${error.message}`)
        }
      } else {
        showNotification("error", "Failed to create entry. Please try again.")
      }
    } finally {
      setNewEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Enhanced update entry
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

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.entry) {
        // Clear edit state
        setEditingId(null)
        setEditEntry({
          title: "",
          content: "",
          titleError: "",
          contentError: "",
          isSubmitting: false,
        })

        // Refresh data
        await fetchEntries()

        showNotification("success", `"${result.entry.title}" updated successfully!`)
        console.log("✅ Entry updated:", result.entry.title)
      } else {
        throw new Error(result.error || "Failed to update entry")
      }
    } catch (error) {
      console.error("❌ Error updating entry:", error)
      showNotification("error", `Failed to update: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setEditEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Enhanced delete entry with mobile-friendly confirmation
  const deleteEntry = async (id: string) => {
    const entry = data.entries.find((e) => e.id === id)
    if (!entry) return

    // Mobile-friendly confirmation
    const confirmMessage = `Delete "${entry.title.length > 30 ? entry.title.substring(0, 30) + "..." : entry.title}"?`
    if (!confirm(confirmMessage)) return

    try {
      console.log("🗑️ Deleting entry...")

      const response = await fetch("/api/content", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.deletedEntry) {
        await fetchEntries()
        showNotification("success", `"${result.deletedEntry.title}" deleted successfully!`)
        console.log("✅ Entry deleted:", result.deletedEntry.title)
      } else {
        throw new Error(result.error || "Failed to delete entry")
      }
    } catch (error) {
      console.error("❌ Error deleting entry:", error)
      showNotification("error", `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Start editing with mobile optimizations
  const startEdit = (entry: TextEntry) => {
    setEditingId(entry.id)
    setEditEntry({
      title: entry.title,
      content: entry.content,
      titleError: "",
      contentError: "",
      isSubmitting: false,
    })

    // Scroll to the editing entry on mobile
    setTimeout(() => {
      const element = document.getElementById(`entry-${entry.id}`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
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

  // Mobile loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Your Data</h2>
          <p className="text-gray-600">Please wait a moment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile-optimized container */}
      <div className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-8">
        {/* Notification - Mobile optimized */}
        {notification && (
          <Alert
            className={`mb-4 ${
              notification.type === "success"
                ? "border-green-500 bg-green-50"
                : notification.type === "error"
                  ? "border-red-500 bg-red-50"
                  : "border-blue-500 bg-blue-50"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : notification.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Info className="h-4 w-4 text-blue-600" />
            )}
            <AlertDescription
              className={`text-sm ${
                notification.type === "success"
                  ? "text-green-800"
                  : notification.type === "error"
                    ? "text-red-800"
                    : "text-blue-800"
              }`}
            >
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Header - Mobile optimized */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Smartphone className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Global Text Storage</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base px-2">Store and access your text content from anywhere</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEntries}
              disabled={isLoading}
              className="w-full sm:w-auto bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh ({data.count} entries)
            </Button>
            {data.lastModified && (
              <p className="text-xs text-gray-500 text-center">
                Updated: {new Date(data.lastModified).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Create New Entry - Mobile optimized */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5" />
              Add New Content
            </CardTitle>
            <CardDescription className="text-sm">Create a new text entry (stored in memory)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="new-title"
                placeholder="Enter title..."
                value={newEntry.title}
                onChange={(e) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    title: e.target.value,
                    titleError: "",
                  }))
                }
                className={`mt-1 ${newEntry.titleError ? "border-red-500" : ""}`}
                disabled={newEntry.isSubmitting}
                maxLength={100}
              />
              {newEntry.titleError && <p className="text-red-500 text-xs mt-1">{newEntry.titleError}</p>}
              <p className="text-xs text-gray-500 mt-1">{newEntry.title.length}/100 characters</p>
            </div>

            <div>
              <Label htmlFor="new-content" className="text-sm font-medium">
                Content *
              </Label>
              <Textarea
                id="new-content"
                placeholder="Enter your content..."
                rows={4}
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    content: e.target.value,
                    contentError: "",
                  }))
                }
                className={`mt-1 resize-none ${newEntry.contentError ? "border-red-500" : ""}`}
                disabled={newEntry.isSubmitting}
                maxLength={5000}
              />
              {newEntry.contentError && <p className="text-red-500 text-xs mt-1">{newEntry.contentError}</p>}
              <p className="text-xs text-gray-500 mt-1">{newEntry.content.length}/5000 characters</p>
            </div>

            <Button onClick={createEntry} className="w-full" disabled={newEntry.isSubmitting} size="lg">
              {newEntry.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
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

        {/* Entries List - Mobile optimized */}
        <div className="space-y-4">
          {data.entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">No entries yet</p>
                  <p className="text-sm">Create your first entry above to get started!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            data.entries.map((entry) => (
              <Card key={entry.id} id={`entry-${entry.id}`} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
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
                            className={`font-semibold ${editEntry.titleError ? "border-red-500" : ""}`}
                            placeholder="Enter title..."
                            disabled={editEntry.isSubmitting}
                            maxLength={100}
                          />
                          {editEntry.titleError && <p className="text-red-500 text-xs">{editEntry.titleError}</p>}
                        </div>
                      ) : (
                        <CardTitle className="text-base sm:text-lg leading-tight break-words">{entry.title}</CardTitle>
                      )}
                      <CardDescription className="text-xs mt-1">
                        <div>Created: {new Date(entry.createdAt).toLocaleDateString()}</div>
                        {entry.updatedAt !== entry.createdAt && (
                          <div>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</div>
                        )}
                      </CardDescription>
                    </div>

                    {/* Action buttons - Mobile optimized */}
                    <div className="flex gap-1 flex-shrink-0">
                      {editingId === entry.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateEntry(entry.id)}
                            disabled={editEntry.isSubmitting}
                            className="px-2"
                          >
                            {editEntry.isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={editEntry.isSubmitting}
                            className="px-2 bg-transparent"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry)} className="px-2">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteEntry(entry.id)}
                            className="px-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
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
                        className={`resize-none ${editEntry.contentError ? "border-red-500" : ""}`}
                        placeholder="Enter content..."
                        disabled={editEntry.isSubmitting}
                        maxLength={5000}
                      />
                      {editEntry.contentError && <p className="text-red-500 text-xs">{editEntry.contentError}</p>}
                      <p className="text-xs text-gray-500">{editEntry.content.length}/5000 characters</p>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md border text-sm leading-relaxed break-words">
                      {entry.content}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mobile footer */}
        <div className="text-center mt-8 pb-4">
          <p className="text-xs text-gray-500">📱 Optimized for mobile • Data stored in memory during session</p>
        </div>
      </div>
    </div>
  )
}
