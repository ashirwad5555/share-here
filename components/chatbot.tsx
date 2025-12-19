"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MessageCircle, Send, Bot, User, Loader2, AlertCircle, X, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [error, setError] = useState("")

  // Check if AI chat is enabled
  useEffect(() => {
    const checkEnabled = async () => {
      try {
        const response = await fetch("/api/chat/enabled")
        const result = await response.json()
        setIsEnabled(result.enabled)

        if (!result.enabled) {
          setError(result.message)
        }
      } catch (error) {
        console.error("Failed to check AI chat status:", error)
        setIsEnabled(false)
        setError("Failed to check AI chat availability")
      }
    }

    checkEnabled()
  }, [])

  // Initialize with welcome message when enabled
  useEffect(() => {
    if (isEnabled && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          text: "Hi! I'm your AI assistant. I can help you with note-taking tips, organization strategies, and answer questions about productivity. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    }
  }, [isEnabled, messages.length])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          token,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.response,
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
      } else {
        setError(result.error || "Failed to get AI response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      setError("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        text: "Hi! I'm your AI assistant. I can help you with note-taking tips, organization strategies, and answer questions about productivity. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ])
    setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 bg-transparent relative"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          AI Chat
          {!isEnabled && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              AI Assistant
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-slate-500 hover:text-slate-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {!isEnabled ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-orange-800 mb-2">AI Chat Not Available</h3>
                <p className="text-orange-700 text-sm mb-4">
                  To enable AI chat, you need to add your Google AI API key to the environment variables.
                </p>
                <div className="text-xs text-orange-600 bg-orange-100 rounded-lg p-4 text-left space-y-3">
                  <div>
                    <strong className="block mb-1">📋 Step 1: Get Your API Key</strong>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline"
                    >
                      Visit Google AI Studio
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div>
                    <strong className="block mb-1">🔧 Step 2: Add to Vercel</strong>
                    <div className="space-y-1">
                      <div>• Go to your Vercel project settings</div>
                      <div>• Navigate to Environment Variables</div>
                      <div>
                        • Add key:{" "}
                        <code className="bg-orange-200 px-1 rounded font-mono">GOOGLE_GENERATIVE_AI_API_KEY</code>
                      </div>
                      <div className="text-[10px] text-orange-500 mt-1">
                        (or <code className="bg-orange-200 px-1 rounded">GEMINI_API_KEY</code>)
                      </div>
                    </div>
                  </div>

                  <div>
                    <strong className="block mb-1">🚀 Step 3: Redeploy</strong>
                    <div>Save the environment variable and Vercel will automatically redeploy</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "bot" && (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-slate-500"}`}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.sender === "user" && (
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                        <span className="text-sm text-slate-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {error && (
              <div className="px-4 pb-2">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about note-taking..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
