"use client"

import { useState } from "react"
import { ConnectionTest } from "@/components/connection-test"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TestPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>BeatMatch Diagnostics</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/")} className="h-8">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-8">
                  <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This page tests your connection to the BeatMatch server. If you're having trouble connecting, this will
              help diagnose the issue.
            </p>
          </CardContent>
        </Card>

        <ConnectionTest />

        <Card className="mt-4">
          <CardContent className="pt-6">
            <h3 className="font-bold mb-2">Troubleshooting Tips:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Make sure you have a stable internet connection</li>
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
              <li>Try a different browser</li>
              <li>Check if the server is online</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
