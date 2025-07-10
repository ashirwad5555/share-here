"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Edit, Plus, Save, X, RefreshCw, CheckCircle, AlertCircle, Loader2, Share2, Globe } from "lucide-react"

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
  storage?: string
  isGlobal?: boolean
}

interface FormState {
  title: string
  content: string
  titleError: string
  contentError: string
  isSubmitting: boolean
}

export default function Component() {
  const [data, setData] = useState<{
    entries: TextEntry[]
    lastModified: string
    count: number
    isGlobal: boolean
    storage: string
  }>({
    entries: [],
    lastModified: "",
    count: 0,
    isGlobal: false,
    storage: "unknown",
  })

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
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Validate form
  const validateForm = (title: string, content: string) => {
    const errors = { titleError: "", contentError: "" }

    if (!title.trim()) {
      errors.titleError = "Title is required"
    } else if (title.trim().length > 100) {
      errors.titleError = "Title too long"
    }

    if (!content.trim()) {
      errors.contentError = "Content is required"
    } else if (content.trim().length > 5000) {
      errors.contentError = "Content too long"
    }

    return errors
  }

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const response = await fetch("/api/content", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.entries) {
        setData({
          entries: result.entries,
          lastModified: result.lastModified || new Date().toISOString(),
          count: result.count || result.entries.length,
          isGlobal: result.isGlobal || false,
          storage: result.storage || "unknown",
        })
      } else {
        throw new Error(result.error || "Failed to load")
      }
    } catch (error) {
      console.error("Error fetching entries:", error)
      showNotification("error", "Failed to load entries")
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  // Create entry
  const createEntry = async () => {
    const errors = validateForm(newEntry.title, newEntry.content)

    if (errors.titleError || errors.contentError) {
      setNewEntry((prev) => ({ ...prev, ...errors }))
      return
    }

    setNewEntry((prev) => ({ ...prev, isSubmitting: true, titleError: "", contentError: "" }))

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEntry.title.trim(),
          content: newEntry.content.trim(),
        }),
      })

      const result: ApiResponse = await response.json()

      if (result.success && result.entry) {
        setNewEntry({
          title: "",
          content: "",
          titleError: "",
          contentError: "",
          isSubmitting: false,
        })

        await fetchEntries()
        showNotification("success", "Entry created!")
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        throw new Error(result.error || "Failed to create")
      }
    } catch (error) {
      showNotification("error", "Failed to create entry")
    } finally {
      setNewEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Update entry
  const updateEntry = async (id: string) => {
    const errors = validateForm(editEntry.title, editEntry.content)

    if (errors.titleError || errors.contentError) {
      setEditEntry((prev) => ({ ...prev, ...errors }))
      return
    }

    setEditEntry((prev) => ({ ...prev, isSubmitting: true, titleError: "", contentError: "" }))

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: editEntry.title.trim(),
          content: editEntry.content.trim(),
        }),
      })

      const result: ApiResponse = await response.json()

      if (result.success && result.entry) {
        setEditingId(null)
        setEditEntry({
          title: "",
          content: "",
          titleError: "",
          contentError: "",
          isSubmitting: false,
        })

        await fetchEntries()
        showNotification("success", "Entry updated!")
      } else {
        throw new Error(result.error || "Failed to update")
      }
    } catch (error) {
      showNotification("error", "Failed to update entry")
    } finally {
      setEditEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Delete entry
  const deleteEntry = async (id: string) => {
    const entry = data.entries.find((e) => e.id === id)
    if (!entry) return

    if (!confirm(`Delete "${entry.title}"?`)) return

    try {
      const response = await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const result: ApiResponse = await response.json()

      if (result.success) {
        await fetchEntries()
        showNotification("success", "Entry deleted!")
      } else {
        throw new Error(result.error || "Failed to delete")
      }
    } catch (error) {
      showNotification("error", "Failed to delete entry")
    }
  }

  // Start editing
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

  // Share URL
  const shareUrl = async () => {
    const url = window.location.href
    const shareData = {
      title: "Text Storage App",
      text: "Check out this text storage app!",
      url: url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("Share cancelled")
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showNotification("success", "URL copied!")
      } catch (error) {
        showNotification("error", "Could not copy URL")
      }
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Notification */}
        {notification && (
          <Alert
            className={`mb-6 ${
              notification.type === "success"
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-red-500 bg-red-50 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {data.isGlobal ? (
              <Globe className="w-8 h-8 text-green-600" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{data.isGlobal ? "Global Notes" : "My Notes"}</h1>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={fetchEntries} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {data.count} notes
            </Button>

            <Button variant="outline" size="sm" onClick={shareUrl}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {data.isGlobal && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Global database active
            </div>
          )}
        </div>

        {/* Create New Entry */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5" />
              Add New Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Note title..."
                value={newEntry.title}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value, titleError: "" }))}
                className={newEntry.titleError ? "border-red-500" : ""}
                disabled={newEntry.isSubmitting}
                maxLength={100}
              />
              {newEntry.titleError && <p className="text-red-500 text-sm mt-1">{newEntry.titleError}</p>}
            </div>

            <div>
              <Textarea
                placeholder="Write your note here..."
                rows={4}
                value={newEntry.content}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, content: e.target.value, contentError: "" }))}
                className={`resize-none ${newEntry.contentError ? "border-red-500" : ""}`}
                disabled={newEntry.isSubmitting}
                maxLength={5000}
              />
              {newEntry.contentError && <p className="text-red-500 text-sm mt-1">{newEntry.contentError}</p>}
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
                  Add Note
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-4">
          {data.entries.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="w-16 h-16 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No notes yet</h3>
                <p className="text-gray-500">Create your first note above to get started!</p>
              </CardContent>
            </Card>
          ) : (
            data.entries.map((entry) => (
              <Card key={entry.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {editingId === entry.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editEntry.title}
                            onChange={(e) =>
                              setEditEntry((prev) => ({ ...prev, title: e.target.value, titleError: "" }))
                            }
                            className={`font-semibold ${editEntry.titleError ? "border-red-500" : ""}`}
                            disabled={editEntry.isSubmitting}
                            maxLength={100}
                          />
                          {editEntry.titleError && <p className="text-red-500 text-sm">{editEntry.titleError}</p>}
                        </div>
                      ) : (
                        <div>
                          <CardTitle className="text-lg leading-tight break-words flex items-center gap-2">
                            {entry.title}
                            {data.isGlobal && <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{new Date(entry.createdAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0">
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                          setEditEntry((prev) => ({ ...prev, content: e.target.value, contentError: "" }))
                        }
                        rows={4}
                        className={`resize-none ${editEntry.contentError ? "border-red-500" : ""}`}
                        disabled={editEntry.isSubmitting}
                        maxLength={5000}
                      />
                      {editEntry.contentError && <p className="text-red-500 text-sm">{editEntry.contentError}</p>}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm leading-relaxed break-words">
                      {entry.content}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-6">
          <p className="text-sm text-gray-400">
            {data.isGlobal ? "🌍 Global database • Real-time sync" : "📱 Mobile optimized • Deploy for global sharing"}
          </p>
        </div>
      </div>
    </div>
  )
}
