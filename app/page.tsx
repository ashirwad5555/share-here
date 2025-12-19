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
  LogOut,
  User,
  FileText,
  Calendar,
  Sparkles,
  Lock,
  Paperclip,
  Download,
  File,
} from "lucide-react"
import LoginForm from "@/components/login-form"
import Chatbot from "@/components/chatbot"

interface FileAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  data: string
  uploadedAt: string
}

interface TextEntry {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  userId: string
  attachments?: FileAttachment[]
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
  attachments: FileAttachment[]
  fileError: string
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
    attachments: [],
    fileError: "",
  })

  const [editEntry, setEditEntry] = useState<FormState>({
    title: "",
    content: "",
    titleError: "",
    contentError: "",
    isSubmitting: false,
    attachments: [],
    fileError: "",
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
      const response = await fetch(`/api/content?token=${encodeURIComponent(authToken)}`, {
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

  const handleFileSelect = async (files: FileList | null, isEdit = false) => {
    if (!files || files.length === 0) return

    const setterFn = isEdit ? setEditEntry : setNewEntry

    // Limit to 5 files
    if (files.length > 5) {
      setterFn((prev) => ({ ...prev, fileError: "Maximum 5 files allowed" }))
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB per file
    const newAttachments: FileAttachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.size > maxSize) {
        setterFn((prev) => ({ ...prev, fileError: `File ${file.name} is too large (max 5MB)` }))
        return
      }

      try {
        const base64 = await fileToBase64(file)
        const attachment: FileAttachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          data: base64,
          uploadedAt: new Date().toISOString(),
        }
        newAttachments.push(attachment)
      } catch (error) {
        setterFn((prev) => ({ ...prev, fileError: `Failed to process ${file.name}` }))
        return
      }
    }

    setterFn((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments],
      fileError: "",
    }))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const removeAttachment = (attachmentId: string, isEdit = false) => {
    const setterFn = isEdit ? setEditEntry : setNewEntry
    setterFn((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attachmentId),
    }))
  }

  const downloadAttachment = (attachment: FileAttachment) => {
    const dataUrl = `data:${attachment.mimeType};base64,${attachment.data}`
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = attachment.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

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
          token: authToken,
          attachments: newEntry.attachments,
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
          attachments: [],
          fileError: "",
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
          token: authToken,
          attachments: editEntry.attachments,
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
          attachments: [],
          fileError: "",
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
        body: JSON.stringify({ id, token: authToken }),
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
      attachments: entry.attachments || [],
      fileError: "",
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
      attachments: [],
      fileError: "",
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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl shadow-2xl mb-8 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
            Loading Your Workspace
          </h2>
          <p className="text-slate-600 text-lg">Preparing your secure environment...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl shadow-2xl mb-8">
            <FileText className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
            Loading Your Notes
          </h2>
          <p className="text-slate-600 text-lg mb-6">Fetching your personal collection...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div
              className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-fuchsia-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                      My Private Notes
                    </h1>
                    <p className="text-slate-600 mt-1 text-lg">
                      Welcome back, <span className="font-semibold text-purple-600">{currentUser.name}</span> ✨
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-purple-200 shadow-sm">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-slate-800">{currentUser.username}</span>
                    <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full font-semibold shadow-sm">
                      {currentUser.role}
                    </span>
                  </div>
                  <Chatbot />
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="border-2 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-purple-100 flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={fetchEntries}
                    disabled={isLoading}
                    className="border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    <span className="font-semibold">{data.count}</span>&nbsp;{data.count === 1 ? "note" : "notes"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareUrl}
                    className="border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share App
                  </Button>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-sm font-semibold shadow-lg">
                  <Lock className="w-4 h-4" />
                  Private & Secure
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Create New Entry */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                Create New Note
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Title
              </label>
              <Input
                placeholder="Enter a captivating title..."
                value={newEntry.title}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value, titleError: "" }))}
                className={`h-12 border-2 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 ${newEntry.titleError ? "border-red-300 focus:border-red-500" : "border-purple-200"}`}
                disabled={newEntry.isSubmitting}
                maxLength={100}
              />
              {newEntry.titleError && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {newEntry.titleError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Content
              </label>
              <Textarea
                placeholder="Write your thoughts here..."
                rows={6}
                value={newEntry.content}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, content: e.target.value, contentError: "" }))}
                className={`resize-none border-2 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 ${newEntry.contentError ? "border-red-300 focus:border-red-500" : "border-purple-200"}`}
                disabled={newEntry.isSubmitting}
                maxLength={5000}
              />
              {newEntry.contentError && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {newEntry.contentError}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments <span className="text-slate-400 font-normal">(Optional - Max 5 files, 5MB each)</span>
              </label>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("new-file-input")?.click()}
                  disabled={newEntry.isSubmitting || newEntry.attachments.length >= 5}
                  className="border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                <input
                  id="new-file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, false)}
                  disabled={newEntry.isSubmitting}
                />
                <span className="text-sm text-slate-500">
                  {newEntry.attachments.length} file{newEntry.attachments.length !== 1 ? "s" : ""} selected
                </span>
              </div>

              {newEntry.fileError && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {newEntry.fileError}
                </p>
              )}

              {newEntry.attachments.length > 0 && (
                <div className="space-y-2">
                  {newEntry.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{attachment.filename}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id, false)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={createEntry}
              disabled={newEntry.isSubmitting || !newEntry.title.trim() || !newEntry.content.trim()}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {newEntry.isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Create Note
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-6">
          {data.entries.length === 0 ? (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
              <CardContent className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-tr from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <FileText className="w-12 h-12 text-slate-500" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4">No notes yet</h3>
                <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
                  Start your journey by creating your first note. Your thoughts deserve a beautiful home! ✨
                </p>
                <Button
                  onClick={() => document.querySelector("input")?.focus()}
                  className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            data.entries.map((entry, index) => (
              <Card
                key={entry.id}
                className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-300"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                {editingId === entry.id ? (
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Title
                      </label>
                      <Input
                        placeholder="Title"
                        value={editEntry.title}
                        onChange={(e) => setEditEntry((prev) => ({ ...prev, title: e.target.value, titleError: "" }))}
                        className={`h-12 border-2 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 ${editEntry.titleError ? "border-red-300 focus:border-red-500" : "border-purple-200"}`}
                        disabled={editEntry.isSubmitting}
                        maxLength={100}
                      />
                      {editEntry.titleError && (
                        <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {editEntry.titleError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Content
                      </label>
                      <Textarea
                        placeholder="Content"
                        rows={6}
                        value={editEntry.content}
                        onChange={(e) =>
                          setEditEntry((prev) => ({ ...prev, content: e.target.value, contentError: "" }))
                        }
                        className={`resize-none border-2 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 ${editEntry.contentError ? "border-red-300 focus:border-red-500" : "border-purple-200"}`}
                        disabled={editEntry.isSubmitting}
                        maxLength={5000}
                      />
                      {editEntry.contentError && (
                        <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {editEntry.contentError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attachments{" "}
                        <span className="text-slate-400 font-normal">(Optional - Max 5 files, 5MB each)</span>
                      </label>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById(`edit-file-input-${entry.id}`)?.click()}
                          disabled={editEntry.isSubmitting || editEntry.attachments.length >= 5}
                          className="border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                        >
                          <Paperclip className="w-4 h-4 mr-2" />
                          Choose Files
                        </Button>
                        <input
                          id={`edit-file-input-${entry.id}`}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files, true)}
                          disabled={editEntry.isSubmitting}
                        />
                        <span className="text-sm text-slate-500">
                          {editEntry.attachments.length} file{editEntry.attachments.length !== 1 ? "s" : ""} selected
                        </span>
                      </div>

                      {editEntry.fileError && (
                        <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {editEntry.fileError}
                        </p>
                      )}

                      {editEntry.attachments.length > 0 && (
                        <div className="space-y-2">
                          {editEntry.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <File className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-800 truncate">{attachment.filename}</p>
                                  <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(attachment.id, true)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => updateEntry(entry.id)}
                        disabled={editEntry.isSubmitting}
                        className="flex-1 h-11 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {editEntry.isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={editEntry.isSubmitting}
                        className="border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 bg-transparent"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3 break-words">
                            {entry.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-full border border-purple-200">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                            {entry.updatedAt !== entry.createdAt && (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full border border-blue-200">
                                <Edit className="w-3.5 h-3.5" />
                                Updated {new Date(entry.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                            {entry.attachments && entry.attachments.length > 0 && (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200">
                                <Paperclip className="w-3.5 h-3.5" />
                                {entry.attachments.length} file{entry.attachments.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => startEdit(entry)}
                            className="h-10 w-10 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteEntry(entry.id)}
                            className="h-10 w-10 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base break-words">
                        {entry.content}
                      </p>

                      {entry.attachments && entry.attachments.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-purple-100 space-y-3">
                          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                            <Paperclip className="w-4 h-4" />
                            Attachments
                          </h4>
                          <div className="space-y-2">
                            {entry.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-purple-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-gradient-to-tr from-violet-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <File className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                      {attachment.filename}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {formatFileSize(attachment.size)} •{" "}
                                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadAttachment(attachment)}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 flex-shrink-0"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            ))
          )}

          {data.entries.length === 0 && (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-violet-100 to-purple-100 rounded-3xl mb-6">
                  <FileText className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No notes yet</h3>
                <p className="text-slate-600 text-lg">Create your first note to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 pb-8">
          <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-purple-600">{currentUser.name}</span>
            </div>
            <div className="w-px h-5 bg-gradient-to-b from-purple-200 via-purple-300 to-purple-200"></div>
            <div className="text-sm text-slate-500 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Private Notes
            </div>
            <div className="w-px h-5 bg-gradient-to-b from-purple-200 via-purple-300 to-purple-200"></div>
            <div className="text-sm text-slate-500 flex items-center gap-1.5">
              {data.isGlobal ? "🌍" : "💾"} {data.isGlobal ? "Global" : "Local"} Storage
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
