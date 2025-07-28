"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Trash2,
  Edit,
  Plus,
  Save,
  X,
  RefreshCw,
  Loader2,
  Share2,
  Globe,
  LogOut,
  User,
  FileText,
  Calendar,
} from "lucide-react"
import LoginForm from "@/components/login-form"
import Chatbot from "@/components/chatbot"

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

interface AuthUser {
  id: string
  username: string
  name: string
  role: string
}

export default function Component() {
  const { toast } = useToast()
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

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
  const showNotification = useCallback(
    (type: "success" | "error", message: string) => {
      toast({
        title: type === "success" ? "Success" : "Error",
        description: message,
        variant: type === "error" ? "destructive" : "default",
      })
    },
    [toast],
  )

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token) {
      verifyToken(token)
    } else {
      setIsAuthLoading(false)
    }
  }, [])

  // Verify token with server
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const result = await response.json()

      if (result.success && result.user) {
        setAuthToken(token)
        setCurrentUser(result.user)
        localStorage.setItem("authToken", token)
      } else {
        localStorage.removeItem("authToken")
        setAuthToken(null)
        setCurrentUser(null)
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      localStorage.removeItem("authToken")
      setAuthToken(null)
      setCurrentUser(null)
    } finally {
      setIsAuthLoading(false)
    }
  }

  // Handle login
  const handleLogin = (token: string) => {
    localStorage.setItem("authToken", token)
    verifyToken(token)
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("authToken")
    setAuthToken(null)
    setCurrentUser(null)
    setData({
      entries: [],
      lastModified: "",
      count: 0,
      isGlobal: false,
      storage: "unknown",
    })
  }

  // Validate form
  const validateForm = (title: string, content: string) => {
    const errors = { titleError: "", contentError: "" }

    if (!title.trim()) {
      errors.titleError = "Title is required"
    } else if (title.trim().length > 100) {
      errors.titleError = "Title too long (max 100 characters)"
    }

    if (!content.trim()) {
      errors.contentError = "Content is required"
    } else if (content.trim().length > 5000) {
      errors.contentError = "Content too long (max 5000 characters)"
    }

    return errors
  }

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    if (!authToken) return

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
  }, [authToken, showNotification])

  // Create entry
  const createEntry = async () => {
    if (!authToken) return

    const errors = validateForm(newEntry.title, newEntry.content)

    if (errors.titleError || errors.contentError) {
      setNewEntry((prev) => ({ ...prev, ...errors }))
      return
    }

    setNewEntry((prev) => ({ ...prev, isSubmitting: true, titleError: "", contentError: "" }))

    try {
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
        showNotification("success", "Note created successfully!")
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        throw new Error(result.error || "Failed to create")
      }
    } catch (error) {
      showNotification("error", "Failed to create note")
    } finally {
      setNewEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Update entry
  const updateEntry = async (id: string) => {
    if (!authToken) return

    const errors = validateForm(editEntry.title, editEntry.content)

    if (errors.titleError || errors.contentError) {
      setEditEntry((prev) => ({ ...prev, ...errors }))
      return
    }

    setEditEntry((prev) => ({ ...prev, isSubmitting: true, titleError: "", contentError: "" }))

    try {
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
        showNotification("success", "Note updated successfully!")
      } else {
        throw new Error(result.error || "Failed to update")
      }
    } catch (error) {
      showNotification("error", "Failed to update note")
    } finally {
      setEditEntry((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!authToken) return

    const entry = data.entries.find((e) => e.id === id)
    if (!entry) return

    if (!confirm(`Are you sure you want to delete "${entry.title}"?`)) return

    try {
      const response = await fetch("/api/content", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      const result: ApiResponse = await response.json()

      if (result.success) {
        await fetchEntries()
        showNotification("success", "Note deleted successfully!")
      } else {
        throw new Error(result.error || "Failed to delete")
      }
    } catch (error) {
      showNotification("error", "Failed to delete note")
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
      title: "Professional Notes App",
      text: "Check out this secure notes application!",
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
        showNotification("success", "URL copied to clipboard!")
      } catch (error) {
        showNotification("error", "Could not copy URL")
      }
    }
  }

  // Load data when authenticated
  useEffect(() => {
    if (authToken && currentUser) {
      fetchEntries()
    }
  }, [authToken, currentUser, fetchEntries])

  // Show loading screen while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Loading...</h2>
          <p className="text-slate-600">Initializing your workspace</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!authToken || !currentUser) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Loading screen for data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Loading Notes</h2>
          <p className="text-slate-600">Fetching your secure notes...</p>
          <div className="mt-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    {data.isGlobal ? (
                      <Globe className="w-6 h-6 text-white" />
                    ) : (
                      <FileText className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{data.isGlobal ? "Global Notes" : "My Notes"}</h1>
                    <p className="text-slate-600 mt-1">Welcome back, {currentUser.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-800">{currentUser.username}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {currentUser.role}
                    </span>
                  </div>
                  <Chatbot />
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={fetchEntries}
                    disabled={isLoading}
                    className="border-slate-200 hover:bg-blue-50 hover:border-blue-200 bg-transparent"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    {data.count} {data.count === 1 ? "note" : "notes"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareUrl}
                    className="border-slate-200 hover:bg-green-50 hover:border-green-200 bg-transparent"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {data.isGlobal && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Global Database Active
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Create New Entry */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Create New Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input
                placeholder="Enter note title..."
                value={newEntry.title}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value, titleError: "" }))}
                className={`h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 ${newEntry.titleError ? "border-red-300 focus:border-red-500" : ""}`}
                disabled={newEntry.isSubmitting}
                maxLength={100}
              />
              {newEntry.titleError && <p className="text-red-600 text-sm font-medium">{newEntry.titleError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Content</label>
              <Textarea
                placeholder="Write your note content here..."
                rows={5}
                value={newEntry.content}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, content: e.target.value, contentError: "" }))}
                className={`resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 ${newEntry.contentError ? "border-red-300 focus:border-red-500" : ""}`}
                disabled={newEntry.isSubmitting}
                maxLength={5000}
              />
              {newEntry.contentError && <p className="text-red-600 text-sm font-medium">{newEntry.contentError}</p>}
              <div className="text-right text-xs text-slate-500">{newEntry.content.length}/5000 characters</div>
            </div>

            <Button
              onClick={createEntry}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={newEntry.isSubmitting}
            >
              {newEntry.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Note...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-6">
          {data.entries.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">No notes yet</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Start organizing your thoughts by creating your first note above. Your notes are secure and private.
                </p>
                <Button
                  onClick={() => document.querySelector("input")?.focus()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            data.entries.map((entry) => (
              <Card
                key={entry.id}
                className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingId === entry.id ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Title</label>
                            <Input
                              value={editEntry.title}
                              onChange={(e) =>
                                setEditEntry((prev) => ({ ...prev, title: e.target.value, titleError: "" }))
                              }
                              className={`h-12 font-semibold text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 ${editEntry.titleError ? "border-red-300 focus:border-red-500" : ""}`}
                              disabled={editEntry.isSubmitting}
                              maxLength={100}
                            />
                            {editEntry.titleError && (
                              <p className="text-red-600 text-sm font-medium">{editEntry.titleError}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <CardTitle className="text-xl leading-tight break-words flex items-center gap-3 text-slate-800">
                            {entry.title}
                            {data.isGlobal && <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(entry.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            {entry.updatedAt !== entry.createdAt && (
                              <span className="text-blue-600 font-medium">• Updated</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      {editingId === entry.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateEntry(entry.id)}
                            disabled={editEntry.isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white"
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
                            className="border-slate-200 hover:bg-slate-50 bg-transparent"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(entry)}
                            className="border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteEntry(entry.id)}
                            className="border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
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
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Content</label>
                        <Textarea
                          value={editEntry.content}
                          onChange={(e) =>
                            setEditEntry((prev) => ({ ...prev, content: e.target.value, contentError: "" }))
                          }
                          rows={6}
                          className={`resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 ${editEntry.contentError ? "border-red-300 focus:border-red-500" : ""}`}
                          disabled={editEntry.isSubmitting}
                          maxLength={5000}
                        />
                        {editEntry.contentError && (
                          <p className="text-red-600 text-sm font-medium">{editEntry.contentError}</p>
                        )}
                        <div className="text-right text-xs text-slate-500">
                          {editEntry.content.length}/5000 characters
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed break-words">
                        {entry.content}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <div className="inline-flex items-center gap-6 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">{currentUser.name}</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="text-sm text-slate-500">{data.isGlobal ? "🌍 Global Database" : "📱 Local Storage"}</div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="text-sm text-slate-500">🔒 Secure & Private</div>
          </div>
        </div>
      </div>
    </div>
  )
}
