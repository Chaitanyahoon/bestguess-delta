"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react"

export function ConnectionTest() {
  const [tests, setTests] = useState({
    backend: { status: "pending", message: "", details: "" },
    socket: { status: "pending", message: "", details: "" },
    ping: { status: "pending", message: "", details: "" },
  })
  const [isRunning, setIsRunning] = useState(false)
  const [serverInfo, setServerInfo] = useState<any>(null)

  const updateTest = (test: string, status: string, message: string, details = "") => {
    setTests((prev) => ({
      ...prev,
      [test]: { status, message, details },
    }))
  }

  const runTests = async () => {
    setIsRunning(true)
    setServerInfo(null)

    // Reset tests
    setTests({
      backend: { status: "pending", message: "", details: "" },
      socket: { status: "pending", message: "", details: "" },
      ping: { status: "pending", message: "", details: "" },
    })

    const backendUrl = "https://beatmatch-jbss.onrender.com"

    // Test 1: Backend Health Check
    try {
      updateTest("backend", "pending", "Testing backend connection...", "Checking if server is online")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${backendUrl}/health`, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "BeatMatch-Test",
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        try {
          const data = await response.json()
          setServerInfo(data)
          if (data.status === "OK") {
            updateTest(
              "backend",
              "success",
              "Backend server is online",
              `Rooms: ${data.rooms || 0}, Players: ${data.players || 0}, Uptime: ${data.uptime || "unknown"}`,
            )
          } else {
            updateTest("backend", "error", "Backend returned unexpected response", JSON.stringify(data))
          }
        } catch (e) {
          updateTest("backend", "error", "Backend returned invalid JSON", "Server might be starting up")
        }
      } else {
        updateTest("backend", "error", `Backend returned HTTP ${response.status}`, `${response.statusText}`)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        updateTest("backend", "error", "Backend request timed out", "Server might be sleeping or overloaded")
      } else {
        updateTest("backend", "error", "Cannot reach backend server", error.message || "Network error")
      }
    }

    // Test 2: Socket Connection
    try {
      updateTest(
        "socket",
        "pending",
        "Testing socket connection...",
        "Attempting to establish WebSocket/polling connection",
      )

      const { io } = await import("socket.io-client")
      const testSocket = io(backendUrl, {
        transports: ["polling"],
        timeout: 15000,
        forceNew: true,
        withCredentials: false,
        upgrade: false,
      })

      let socketConnected = false
      let pingReceived = false

      testSocket.on("connect", () => {
        socketConnected = true
        updateTest("socket", "success", "Socket connected successfully", `Socket ID: ${testSocket.id}`)

        // Test 3: Ping Test
        updateTest("ping", "pending", "Testing ping...", "Sending ping to test real-time communication")
        testSocket.emit("ping")
      })

      testSocket.on("pong", () => {
        pingReceived = true
        updateTest("ping", "success", "Ping successful", "Real-time communication is working")
        testSocket.disconnect()
        setIsRunning(false)
      })

      testSocket.on("connect_error", (error) => {
        updateTest("socket", "error", "Socket connection failed", error.message)
        if (!pingReceived) {
          updateTest("ping", "error", "Ping test skipped", "No socket connection available")
        }
        setIsRunning(false)
      })

      // Set timeout for socket test
      setTimeout(() => {
        if (!socketConnected) {
          updateTest("socket", "error", "Socket connection timed out", "Server might not support real-time connections")
          if (!pingReceived) {
            updateTest("ping", "error", "Ping test skipped", "Connection timed out")
          }
          testSocket.disconnect()
          setIsRunning(false)
        }
      }, 15000)

      // Set timeout for ping test
      setTimeout(() => {
        if (socketConnected && !pingReceived) {
          updateTest("ping", "error", "Ping timed out", "Socket connected but ping/pong not working")
          testSocket.disconnect()
          setIsRunning(false)
        }
      }, 20000)
    } catch (error: any) {
      updateTest("socket", "error", "Socket initialization failed", error.message)
      updateTest("ping", "error", "Ping test skipped", "Socket initialization failed")
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "pending":
        return isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <AlertCircle className="w-4 h-4 text-gray-400" />
        )
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">OK</Badge>
      case "error":
        return <Badge variant="destructive">FAIL</Badge>
      case "pending":
        return <Badge variant="secondary">{isRunning ? "Testing..." : "Waiting"}</Badge>
      default:
        return <Badge variant="secondary">Waiting</Badge>
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Connection Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {Object.entries(tests).map(([testName, test]) => (
            <div key={testName} className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(test.status)}
                  <span className="font-medium capitalize">
                    {testName} {testName === "backend" ? "Health" : testName === "socket" ? "Connection" : "Test"}
                  </span>
                </div>
                {getStatusBadge(test.status)}
              </div>
              {test.message && <p className="text-sm text-muted-foreground ml-6">{test.message}</p>}
              {test.details && <p className="text-xs text-muted-foreground ml-6 opacity-75">{test.details}</p>}
            </div>
          ))}
        </div>

        {serverInfo && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Server Information</h4>
            <div className="text-sm space-y-1">
              <p>Status: {serverInfo.status}</p>
              <p>Rooms: {serverInfo.rooms || 0}</p>
              <p>Players: {serverInfo.players || 0}</p>
              {serverInfo.uptime && <p>Uptime: {serverInfo.uptime}</p>}
            </div>
          </div>
        )}

        <Button onClick={runTests} disabled={isRunning} className="w-full">
          {isRunning ? "Running Tests..." : "Run Tests Again"}
        </Button>

        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://beatmatch-jbss.onrender.com/health", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Check Server Directly
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
