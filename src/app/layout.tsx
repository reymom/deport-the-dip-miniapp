import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import PrivyWrapper from "@/components/PrivyWrapper"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DEPORT THE DIP - Based copytrading for the deportation generation",
  description: "One dip at a time. One trade at a time. One deportation at a time.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen`}>
        <PrivyWrapper>
          <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6 max-w-md">{children}</div>
          </div>
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                color: "#f1f5f9",
              },
            }}
          />
        </PrivyWrapper>
      </body>
    </html>
  )
}
