"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, RefreshCw } from "lucide-react"

export function SimpleBackendTest() {
  const [testResult, setTestResult] = useState<string>("Click to test")
  const [isLoading, setIsLoading] = useState(false)

  const testBackend = async () => {
    setIsLoading(true)
    setTestResult("Testing...")

    try {
      // Method 1: Direct fetch
      const response = await fetch("https://beatmatch-jbss.onrender.com/health")
      const data = await response.json()
      setTestResult(`✅ Success: ${JSON.stringify(data)}`)
    } catch (error) {
      console.error("Direct fetch failed:", error)

      try {
        // Method 2: Using no-cors mode
        const response = await fetch("https://beatmatch-jbss.onrender.com/health", {
          mode: "no-cors",
        })
        setTestResult("⚠️ Backend reachable but CORS blocked (this is expected)")
      } catch (error2) {
        setTestResult(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Simple Backend Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Button onClick={testBackend} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Backend Connection"
            )}
          </Button>
        </div>

        <div className="p-3 bg-gray-50 rounded text-sm">
          <p className="font-medium mb-2">Result:</p>
          <p className="break-words">{testResult}</p>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://beatmatch-jbss.onrender.com/health", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Backend in New Tab
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          <p>If the new tab shows JSON data, the backend is working.</p>
          <p>CORS errors are normal from browser fetch requests.</p>
        </div>
      </CardContent>
    </Card>
  )
}
