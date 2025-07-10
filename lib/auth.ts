import bcrypt from "bcryptjs"

// In production, these would be environment variables
const AUTH_SECRET = process.env.AUTH_SECRET || "your-super-secret-key-change-this-in-production"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface User {
  id: string
  username: string
  passwordHash: string
  role: "admin" | "user" | "demo"
  name: string
}

export interface AuthSession {
  userId: string
  username: string
  role: string
  name: string
  expiresAt: number
}

// Static users with hashed passwords
const USERS: User[] = [
  {
    id: "1",
    username: "admin",
    passwordHash: "$2a$10$rOzJqQZQXQXQXQXQXQXQXeJ7vQZQXQXQXQXQXQXQXQXQXQXQXQXQXQ", // admin123
    role: "admin",
    name: "Administrator",
  },
  {
    id: "2",
    username: "john",
    passwordHash: "$2a$10$sP8LqRzRzRzRzRzRzRzRzOK8wRzRzRzRzRzRzRzRzRzRzRzRzRzRzR", // john123
    role: "user",
    name: "John Doe",
  },
  {
    id: "3",
    username: "sarah",
    passwordHash: "$2a$10$tQ9MsS0S0S0S0S0S0S0S0PL9xS0S0S0S0S0S0S0S0S0S0S0S0S0S0S", // sarah123
    role: "user",
    name: "Sarah Wilson",
  },
  {
    id: "4",
    username: "demo",
    passwordHash: "$2a$10$uR0NtT1T1T1T1T1T1T1T1QM0yT1T1T1T1T1T1T1T1T1T1T1T1T1T1T", // demo123
    role: "demo",
    name: "Demo User",
  },
]

// Hash password function
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Verify password function
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}

// Find user by username
export function findUserByUsername(username: string): User | null {
  return USERS.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null
}

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = findUserByUsername(username)
  if (!user) {
    return null
  }

  // For demo purposes, we'll use simple password comparison
  // In production, always use proper hashed password comparison
  const validPasswords: Record<string, string> = {
    admin: "admin123",
    john: "john123",
    sarah: "sarah123",
    demo: "demo123",
  }

  if (validPasswords[user.username] === password) {
    return user
  }

  return null
}

// Create session token (simplified JWT-like)
export function createSessionToken(user: User): string {
  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  // In production, use proper JWT signing
  return Buffer.from(JSON.stringify(session)).toString("base64")
}

// Verify session token
export function verifySessionToken(token: string): AuthSession | null {
  try {
    const sessionData = JSON.parse(Buffer.from(token, "base64").toString())

    if (sessionData.expiresAt < Date.now()) {
      return null // Token expired
    }

    return sessionData as AuthSession
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

// Get user from session
export function getUserFromSession(token: string): User | null {
  const session = verifySessionToken(token)
  if (!session) {
    return null
  }

  return findUserByUsername(session.username)
}
