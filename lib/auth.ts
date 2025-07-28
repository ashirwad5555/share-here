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

// Static users for demo - in production, these would be in a database
const USERS: User[] = [
  {
    id: "1",
    username: "admin",
    passwordHash: "admin123", // In production, this would be properly hashed
    role: "admin",
    name: "Administrator",
  },
  {
    id: "2",
    username: "john",
    passwordHash: "john123",
    role: "user",
    name: "John Doe",
  },
  {
    id: "3",
    username: "sarah",
    passwordHash: "sarah123",
    role: "user",
    name: "Sarah Wilson",
  },
  {
    id: "4",
    username: "demo",
    passwordHash: "demo123",
    role: "demo",
    name: "Demo User",
  },
]

export function findUserByUsername(username: string): User | null {
  return USERS.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = findUserByUsername(username)
  if (!user) {
    return null
  }

  // Simplified password check for demo
  if (user.passwordHash === password) {
    return user
  }

  return null
}

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

export function getUserFromSession(token: string): User | null {
  const session = verifySessionToken(token)
  if (!session) {
    return null
  }

  return findUserByUsername(session.username)
}
