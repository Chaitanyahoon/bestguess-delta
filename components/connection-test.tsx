"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

export function ConnectionTest() {
  const [tests, setTests] = useState({
    backend: { status: "pending", message: "" },
    cors: { status: "pending", message: "" },
    socket: { status: "pending", message: "" },
    ping: { status: "pending", message: "" },
  })
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (test: string, status: string, message: string) => {
    setTests((prev) => ({
      ...prev,
      [test]: { status, message },
    }))
  }

  const runTests = async () => {
    setIsRunning(true)

    // Reset tests
    setTests({
      backend: { status: "running", message: "Testing..." },
      cors: { status: "pending", message: "" },
      socket: { status: "pending", message: "" },
      ping: { status: "pending", message: "" },
    })

    // Test 1: Backend Health Check with CORS handling
    try {
      updateTest("backend", "running", "Checking backend health...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("https://beatmatch-jbss.onrender.com/health", {
        method: "GET",
        mode: "cors", // Explicitly set CORS mode
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Backend response:", data)

      if (data.status === "ok" || data.status === "OK") {
        updateTest(
          "backend",
          "success",
          `✅ Backend OK - Games: ${data.activeGames || 0}, Clients: ${data.connectedClients || 0}`,
        )

        // Test 2: CORS Test
        updateTest("cors", "success", "✅ CORS working correctly")
      } else {
        updateTest("backend", "error", `❌ Backend status: ${data.status}`)
        updateTest("cors", "error", "❌ Backend responded but status not OK")
      }
    } catch (error) {
      console.error("Backend test error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          updateTest("backend", "error", "❌ Backend timeout (10s)")
          updateTest("cors", "error", "❌ Request timeout")
        } else if (error.message.includes("CORS")) {
          updateTest("backend", "error", "❌ CORS policy blocked request")
          updateTest("cors", "error", "❌ CORS not configured properly")
        } else if (error.message.includes("Failed to fetch")) {
          updateTest("backend", "error", "❌ Network error - backend unreachable")
          updateTest("cors", "error", "❌ Network/CORS issue")
        } else {
          updateTest("backend", "error", `❌ Error: ${error.message}`)
          updateTest("cors", "error", "❌ Request failed")
        }
      } else {
        updateTest("backend", "error", "❌ Unknown error occurred")
        updateTest("cors", "error", "❌ Unknown error")
      }
    }

    // Test 3: Alternative backend test using JSONP-like approach
    if (tests.backend.status === "error") {
      try {
        updateTest("backend", "running", "Trying alternative connection method...")

        // Try a simple image request to test basic connectivity
        const img = new Image()
        const imageTestPromise = new Promise((resolve, reject) => {
          img.onload = () => resolve("success")
          img.onerror = () => reject(new Error("Image load failed"))
          img.src = "https://beatmatch-jbss.onrender.com/favicon.ico?" + Date.now()
        })

        await imageTestPromise
        updateTest("backend", "warning", "⚠️ Backend reachable but API may have CORS issues")
      } catch {
        updateTest("backend", "error", "❌ Backend completely unreachable")
      }
    }

    // Test 4: Socket Connection (only if backend is accessible)
    if (tests.backend.status === "success" || tests.backend.status === "warning") {
      try {
        updateTest("socket", "running", "Connecting to socket...")

        // Dynamic import to avoid SSR issues
        const { io } = await import("socket.io-client")

        const testSocket = io("https://beatmatch-jbss.onrender.com", {
          transports: ["websocket", "polling"],
          timeout: 15000,
          forceNew: true,
          autoConnect: true,
          reconnection: false,
          withCredentials: false, // Disable credentials for CORS
          extraHeaders: {
            "Access-Control-Allow-Origin": "*",
          },
        })

        // Set up connection handlers
        testSocket.on("connect", () => {
          console.log("Test socket connected:", testSocket.id)
          updateTest("socket", "success", `✅ Connected - ID: ${testSocket.id?.substring(0, 8)}...`)

          // Test 5: Ping Test
          updateTest("ping", "running", "Testing ping...")
          testSocket.emit("ping")

          const pingTimeout = setTimeout(() => {
            updateTest("ping", "error", "❌ Ping timeout (5s)")
            testSocket.disconnect()
            setIsRunning(false)
          }, 5000)

          testSocket.once("pong", () => {
            clearTimeout(pingTimeout)
            console.log("Ping successful")
            updateTest("ping", "success", "✅ Ping successful")
            testSocket.disconnect()
            setIsRunning(false)
          })
        })

        testSocket.on("connect_error", (error) => {
          console.error("Test socket connection error:", error)
          updateTest("socket", "error", `❌ Socket failed: ${error.message}`)
          updateTest("ping", "error", "❌ Cannot ping - no socket connection")
          setIsRunning(false)
        })

        // Connection timeout
        setTimeout(() => {
          if (tests.socket.status === "running") {
            console.log("Socket connection timeout")
            updateTest("socket", "error", "❌ Socket timeout (15s)")
            updateTest("ping", "error", "❌ Cannot ping - socket timeout")
            testSocket.disconnect()
            setIsRunning(false)
          }
        }, 15000)
      } catch (error) {
        console.error("Socket test error:", error)
        updateTest("socket", "error", `❌ Socket error: ${error instanceof Error ? error.message : "Unknown"}`)
        updateTest("ping", "error", "❌ Cannot ping - socket error")
        setIsRunning(false)
      }
    } else {
      updateTest("socket", "error", "❌ Skipped - backend not accessible")
      updateTest("ping", "error", "❌ Skipped - no backend connection")
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-gray-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">PASS</Badge>
      case "warning":
        return <Badge className="bg-yellow-500">WARN</Badge>
      case "error":
        return <Badge variant="destructive">FAIL</Badge>
      case "running":
        return <Badge className="bg-blue-500">RUNNING</Badge>
      case "pending":
        return <Badge variant="secondary">PENDING</Badge>
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>
    }
  }

  useEffect(() => {
    // Auto-run tests on mount
    runTests()
  }, [])

  const allTestsPassed = Object.values(tests).every((test) => test.status === "success")
  const anyTestFailed = Object.values(tests).some((test) => test.status === "error")
  const hasWarnings = Object.values(tests).some((test) => test.status === "warning")

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center">
          Connection Diagnostics
          {allTestsPassed && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
          {hasWarnings && !anyTestFailed && <AlertCircle className="w-5 h-5 text-yellow-500 ml-2" />}
          {anyTestFailed && <XCircle className="w-5 h-5 text-red-500 ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Backend Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.backend.status)}
              <span className="font-medium">Backend Health</span>
            </div>
            {getStatusBadge(tests.backend.status)}
          </div>
          {tests.backend.message && (
            <p className="text-sm text-muted-foreground ml-6 bg-gray-50 p-2 rounded">{tests.backend.message}</p>
          )}

          {/* CORS Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.cors.status)}
              <span className="font-medium">CORS Policy</span>
            </div>
            {getStatusBadge(tests.cors.status)}
          </div>
          {tests.cors.message && (
            <p className="text-sm text-muted-foreground ml-6 bg-gray-50 p-2 rounded">{tests.cors.message}</p>
          )}

          {/* Socket Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.socket.status)}
              <span className="font-medium">Socket Connection</span>
            </div>
            {getStatusBadge(tests.socket.status)}
          </div>
          {tests.socket.message && (
            <p className="text-sm text-muted-foreground ml-6 bg-gray-50 p-2 rounded">{tests.socket.message}</p>
          )}

          {/* Ping Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.ping.status)}
              <span className="font-medium">Ping Test</span>
            </div>
            {getStatusBadge(tests.ping.status)}
          </div>
          {tests.ping.message && (
            <p className="text-sm text-muted-foreground ml-6 bg-gray-50 p-2 rounded">{tests.ping.message}</p>
          )}
        </div>

        <Button onClick={runTests} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run Tests Again"
          )}
        </Button>

        {/* Results Summary */}
        <div className="text-center p-3 rounded border">
          {allTestsPassed && (
            <div className="text-green-600 font-medium">✅ All tests passed! Multiplayer should work perfectly.</div>
          )}
          {hasWarnings && !anyTestFailed && (
            <div className="text-yellow-600 font-medium">⚠️ Some warnings detected. Multiplayer may have issues.</div>
          )}
          {anyTestFailed && (
            <div className="text-red-600 font-medium">❌ Tests failed. Multiplayer likely won't work.</div>
          )}
          {isRunning && <div className="text-blue-600 font-medium">🔄 Tests running... Please wait.</div>}
        </div>

        {/* Troubleshooting Tips */}
        {anyTestFailed && (
          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
            <p className="font-medium mb-2">Troubleshooting Tips:</p>
            <ul className="space-y-1">
              <li>• Check if you're behind a firewall or VPN</li>
              <li>• Try disabling browser extensions</li>
              <li>• Test from a different network/device</li>
              <li>• Backend may need CORS configuration</li>
            </ul>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>Backend: https://beatmatch-jbss.onrender.com</p>
          <p>Frontend: https://beatmatch-delta.vercel.app</p>
        </div>
      </CardContent>
    </Card>
  )
}
