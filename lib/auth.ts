import { USERS, type User } from './users'

const AUTH_SECRET = process.env.AUTH_SECRET || "your-super-secret-key-change-this-in-production"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface AuthSession {
  userId: string
  username: string
  role: string
  name: string
  expiresAt: number
}

export function findUserByUsername(username: string): User | null {
  return USERS.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null
}

export function findUserById(id: string): User | null {
  return USERS.find((user) => user.id === id) || null
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

  return findUserById(session.userId)
}
