"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Globe, Wifi } from "lucide-react"

export function ManualBackendTest() {
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testExternalConnectivity = async () => {
    addResult("Testing external connectivity...")

    // Test 1: Can we reach Google?
    try {
      const response = await fetch("https://www.google.com", { method: "HEAD", mode: "no-cors" })
      addResult("✅ Google.com reachable - Internet connection OK")
    } catch (error) {
      addResult("❌ Cannot reach Google.com - Internet connection issue")
      return
    }

    // Test 2: Can we reach GitHub (another reliable service)?
    try {
      const response = await fetch("https://api.github.com", { method: "HEAD", mode: "no-cors" })
      addResult("✅ GitHub API reachable - External services OK")
    } catch (error) {
      addResult("❌ Cannot reach GitHub API - External service issue")
    }

    // Test 3: Can we reach Render.com itself?
    try {
      const response = await fetch("https://render.com", { method: "HEAD", mode: "no-cors" })
      addResult("✅ Render.com reachable - Hosting platform OK")
    } catch (error) {
      addResult("❌ Cannot reach Render.com - Hosting platform issue")
    }
  }

  const testBackendDirect = async () => {
    addResult("Testing direct backend connection...")

    const methods = [
      { name: "HEAD request", method: "HEAD" },
      { name: "GET request", method: "GET" },
    ]

    for (const testMethod of methods) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const startTime = Date.now()
        const response = await fetch("https://beatmatch-jbss.onrender.com", {
          method: testMethod.method,
          mode: "no-cors",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const endTime = Date.now()
        const responseTime = endTime - startTime

        addResult(`✅ ${testMethod.name} successful (${responseTime}ms)`)
        return true
      } catch (error) {
        if (error.name === "AbortError") {
          addResult(`❌ ${testMethod.name} timeout (30s) - likely cold start`)
        } else {
          addResult(`❌ ${testMethod.name} failed: ${error.message}`)
        }
      }
    }

    return false
  }

  const runFullTest = async () => {
    setTestResults([])
    addResult("Starting comprehensive connectivity test...")

    await testExternalConnectivity()
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds
    await testBackendDirect()

    addResult("Test completed!")
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Manual Connectivity Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          This test checks basic internet connectivity and then tries to reach the backend server directly.
        </div>

        <div className="flex space-x-2">
          <Button onClick={runFullTest} className="flex-1">
            <Wifi className="w-4 h-4 mr-2" />
            Run Full Test
          </Button>
          <Button onClick={clearResults} variant="outline" className="flex-1">
            Clear Results
          </Button>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://beatmatch-jbss.onrender.com", "_blank")}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Backend in New Tab
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://beatmatch-jbss.onrender.com/health", "_blank")}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Backend Health Check
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="p-3 bg-gray-50 rounded text-sm max-h-48 overflow-y-auto">
            <div className="font-medium mb-2">Test Results:</div>
            {testResults.map((result, index) => (
              <div key={index} className="font-mono text-xs mb-1">
                {result}
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm">
            <p className="font-medium text-yellow-800">💡 Troubleshooting Tips:</p>
            <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
              <li>Try opening the backend URL in a new tab manually</li>
              <li>Wait 30-60 seconds for Render.com cold start</li>
              <li>Check if you're behind a corporate firewall</li>
              <li>Try from a different network (mobile hotspot)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
