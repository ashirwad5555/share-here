"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Lock, AlertCircle, Sparkles, LogIn } from "lucide-react"

interface LoginFormProps {
  onLogin: (token: string) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (result.success) {
        onLogin(result.token)
      } else {
        setError(result.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const demoUsers = [
    {
      username: "admin",
      password: "admin123",
      name: "Administrator",
      role: "admin",
      color: "from-red-500 to-orange-500",
    },
    { username: "john", password: "john123", name: "John Doe", role: "user", color: "from-blue-500 to-cyan-500" },
    {
      username: "sarah",
      password: "sarah123",
      name: "Sarah Wilson",
      role: "user",
      color: "from-purple-500 to-pink-500",
    },
    { username: "demo", password: "demo123", name: "Demo User", role: "demo", color: "from-emerald-500 to-teal-500" },
  ]

  const fillDemoCredentials = (user: (typeof demoUsers)[0]) => {
    setUsername(user.username)
    setPassword(user.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl shadow-2xl mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-slate-600 text-lg">Sign in to access your private notes ✨</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-11 h-14 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 text-base"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-14 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 text-base"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Demo Accounts
            </CardTitle>
            <p className="text-sm text-slate-600 text-center font-medium">
              Click any account to auto-fill credentials ⚡
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoUsers.map((user, index) => (
              <button
                key={user.username}
                onClick={() => fillDemoCredentials(user)}
                className="w-full p-4 text-left bg-gradient-to-br from-slate-50 to-purple-50 hover:from-slate-100 hover:to-purple-100 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-200 group shadow-sm hover:shadow-lg transform hover:scale-[1.02]"
                disabled={isLoading}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${user.color} rounded-xl flex items-center justify-center shadow-md`}
                    >
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 group-hover:text-slate-900 text-lg">{user.name}</div>
                      <div className="text-sm text-slate-500 font-medium">@{user.username}</div>
                    </div>
                  </div>
                  <div
                    className={`text-xs px-3 py-1.5 bg-gradient-to-r ${user.color} text-white rounded-full font-bold shadow-md`}
                  >
                    {user.role}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 font-medium">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-lg">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Your data is private and secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}
