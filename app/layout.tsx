import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Global Text Storage - Shared Database",
  description:
    "Truly global text storage with shared database. Everyone sees the same content in real-time via Vercel KV.",
  generator: "v0.dev",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#10b981",
  manifest: "/manifest.json",
  keywords: ["text storage", "global database", "shared content", "vercel kv", "real-time sync"],
  openGraph: {
    title: "Global Text Storage - Shared Database",
    description: "Everyone sees the same content! Create, edit, and share text globally.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Global Text Storage" />
        <meta
          name="description"
          content="Truly global text storage with shared database. Everyone sees the same content in real-time."
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
