export interface User {
  id: string
  username: string
  passwordHash: string
  role: "admin" | "user" | "demo"
  name: string
}

// Static users for demo - in production, these would be in a database
export const USERS: User[] = [
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
