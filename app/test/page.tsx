"use client"

import { BackendStatus } from "@/components/backend-status"
import { ManualBackendTest } from "@/components/manual-backend-test"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle } from "lucide-react"

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
        <h1 className="text-4xl font-bold text-white mb-2">Backend Connectivity Test</h1>
        <p className="text-white/80">Diagnosing backend server connectivity issues</p>
      </div>

      <div className="space-y-6 w-full max-w-2xl">
        <BackendStatus />
        <ManualBackendTest />
      </div>

      <div className="mt-8 text-center text-white/60 text-sm max-w-md">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-white mb-2">Common Issue: Render.com Cold Start</p>
              <p className="text-white/80 text-sm">
                Free tier servers on Render.com go to sleep after 15 minutes of inactivity. The first request can take
                30-60 seconds to wake up the server. This is normal behavior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
