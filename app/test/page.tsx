"use client"

import { ConnectionTest } from "@/components/connection-test"
import { SimpleBackendTest } from "@/components/simple-backend-test"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function TestPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      <Button
        onClick={() => router.push("/")}
        variant="outline"
        className="fixed top-4 left-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Connection Test</h1>
        <p className="text-white/80">Testing connectivity to BeatMatch servers</p>
      </div>

      <div className="space-y-6 w-full max-w-2xl">
        <SimpleBackendTest />
        <ConnectionTest />
      </div>

      <div className="mt-8 text-center text-white/60 text-sm max-w-md">
        <p>
          The "Failed to fetch" error is usually caused by CORS policy. This is normal for browser security. Socket.io
          connections should still work for the actual game.
        </p>
      </div>
    </div>
  )
}
