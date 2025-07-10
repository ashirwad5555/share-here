"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Edit, Plus, Save, X } from "lucide-react"

interface TextEntry {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function Component() {
  const [entries, setEntries] = useState<TextEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState({ title: "", content: "" })
  const [editEntry, setEditEntry] = useState({ title: "", content: "" })

  // Fetch all entries
  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/content")
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new entry
  const createEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      })

      if (response.ok) {
        setNewEntry({ title: "", content: "" })
        fetchEntries()
      }
    } catch (error) {
      console.error("Error creating entry:", error)
    }
  }

  // Update entry
  const updateEntry = async (id: string) => {
    if (!editEntry.title.trim() || !editEntry.content.trim()) return

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editEntry }),
      })

      if (response.ok) {
        setEditingId(null)
        setEditEntry({ title: "", content: "" })
        fetchEntries()
      }
    } catch (error) {
      console.error("Error updating entry:", error)
    }
  }

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      const response = await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        fetchEntries()
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }

  // Start editing
  const startEdit = (entry: TextEntry) => {
    setEditingId(entry.id)
    setEditEntry({ title: entry.title, content: entry.content })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setEditEntry({ title: "", content: "" })
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Text Storage</h1>
          <p className="text-gray-600">Store and access your text content from anywhere in the world</p>
        </div>

        {/* Create New Entry */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Content
            </CardTitle>
            <CardDescription>Create a new text entry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                placeholder="Enter title..."
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new-content">Content</Label>
              <Textarea
                id="new-content"
                placeholder="Enter your content..."
                rows={4}
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              />
            </div>
            <Button onClick={createEntry} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No entries found. Create your first entry above!</p>
              </CardContent>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingId === entry.id ? (
                        <Input
                          value={editEntry.title}
                          onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                          className="text-lg font-semibold mb-2"
                        />
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
                          <Button size="sm" onClick={() => updateEntry(entry.id)}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
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
                    <Textarea
                      value={editEntry.content}
                      onChange={(e) => setEditEntry({ ...editEntry, content: e.target.value })}
                      rows={4}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">{entry.content}</div>
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
