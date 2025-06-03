"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2 } from "lucide-react"

export function DirectConnection() {
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")
  const [socketId, setSocketId] = useState("")

  const testConnection = async () => {
    setStatus("loading")
    setMessage("Starting comprehensive connection test...")

    try {
      // Test 1: Basic network connectivity
      setMessage("1. Testing basic network connectivity...")

      try {
        const startTime = Date.now()
        const response = await fetch("https://httpbin.org/get", {
          method: "GET",
          mode: "cors",
        })
        const endTime = Date.now()

        if (response.ok) {
          setMessage((prev) => `${prev}\n✅ Basic internet connectivity works (${endTime - startTime}ms)`)
        } else {
          setMessage((prev) => `${prev}\n⚠️ Basic connectivity test returned ${response.status}`)
        }
      } catch (error) {
        setMessage((prev) => `${prev}\n❌ Basic connectivity failed: ${error.message}`)
      }

      // Test 2: Backend server reachability
      setMessage((prev) => `${prev}\n\n2. Testing backend server reachability...`)

      try {
        // Use a simple HEAD request to avoid CORS preflight
        const response = await fetch("https://beatmatch-jbss.onrender.com", {
          method: "HEAD",
          mode: "no-cors", // This bypasses CORS but we can't read the response
        })
        setMessage((prev) => `${prev}\n✅ Backend server is reachable`)
      } catch (error) {
        setMessage((prev) => `${prev}\n❌ Backend server unreachable: ${error.message}`)
      }

      // Test 3: Socket.io with detailed error handling
      setMessage((prev) => `${prev}\n\n3. Testing Socket.io connection...`)

      await testSocketConnection()
    } catch (error) {
      console.error("Test error:", error)
      setStatus("error")
      setMessage((prev) => `${prev}\n❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const testSocketConnection = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        // Dynamic import to ensure it works in all environments
        const { io } = await import("socket.io-client")

        setMessage((prev) => `${prev}\nAttempting socket connection...`)

        const socket = io("https://beatmatch-jbss.onrender.com", {
          transports: ["polling"], // Start with polling only
          timeout: 10000,
          forceNew: true,
          reconnection: false,
          autoConnect: true,
          upgrade: false, // Disable upgrade to websocket
          rememberUpgrade: false,
        })

        let connected = false
        let errorOccurred = false

        // Set up event listeners
        socket.on("connect", () => {
          if (errorOccurred) return

          connected = true
          setSocketId(socket.id || "")
          setStatus("success")
          setMessage((prev) => `${prev}\n✅ Socket connected successfully!`)
          setMessage((prev) => `${prev}\nSocket ID: ${socket.id}`)
          setMessage((prev) => `${prev}\nTransport: ${socket.io.engine.transport.name}`)

          // Test a simple ping
          socket.emit("ping")

          const pingTimeout = setTimeout(() => {
            setMessage((prev) => `${prev}\n⚠️ Ping timeout (but connection is working)`)
            socket.disconnect()
            resolve("connected")
          }, 3000)

          socket.once("pong", () => {
            clearTimeout(pingTimeout)
            setMessage((prev) => `${prev}\n✅ Ping/pong successful!`)
            socket.disconnect()
            resolve("success")
          })
        })

        socket.on("connect_error", (error) => {
          if (connected) return

          errorOccurred = true
          console.error("Socket connect_error:", error)
          setMessage((prev) => `${prev}\n❌ Socket connect_error: ${error.message}`)
          setMessage((prev) => `${prev}\nError type: ${error.type || "unknown"}`)
          setMessage((prev) => `${prev}\nError description: ${error.description || "none"}`)

          setStatus("error")
          socket.disconnect()
          resolve("error")
        })

        socket.on("disconnect", (reason) => {
          setMessage((prev) => `${prev}\nSocket disconnected: ${reason}`)
        })

        socket.on("error", (error) => {
          console.error("Socket general error:", error)
          setMessage((prev) => `${prev}\n❌ Socket error: ${error.message || error}`)
        })

        // Overall timeout
        setTimeout(() => {
          if (!connected && !errorOccurred) {
            errorOccurred = true
            setMessage((prev) => `${prev}\n❌ Socket connection timeout (10s)`)
            setStatus("error")
            socket.disconnect()
            resolve("timeout")
          }
        }, 10000)
      } catch (importError) {
        console.error("Socket.io import error:", importError)
        setMessage((prev) => `${prev}\n❌ Failed to load Socket.io: ${importError.message}`)
        setStatus("error")
        resolve("import-error")
      }
    })
  }

  const testSimpleConnection = async () => {
    setStatus("loading")
    setMessage("Running simple diagnostic test...")

    try {
      // Test 1: Check if we're in the right environment
      setMessage("Environment check...")
      setMessage((prev) => `${prev}\nUser Agent: ${navigator.userAgent.substring(0, 50)}...`)
      setMessage((prev) => `${prev}\nLocation: ${window.location.href}`)

      // Test 2: DNS resolution test
      setMessage((prev) => `${prev}\n\nTesting DNS resolution...`)

      try {
        const img = new Image()
        const dnsTest = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("DNS timeout"))
          }, 5000)

          img.onload = () => {
            clearTimeout(timeout)
            resolve("DNS works")
          }

          img.onerror = (e) => {
            clearTimeout(timeout)
            reject(new Error("DNS failed"))
          }

          // Use a simple image from the backend
          img.src = `https://beatmatch-jbss.onrender.com/favicon.ico?t=${Date.now()}`
        })

        await dnsTest
        setMessage((prev) => `${prev}\n✅ DNS resolution works`)
      } catch (dnsError) {
        setMessage((prev) => `${prev}\n❌ DNS resolution failed: ${dnsError.message}`)
      }

      // Test 3: Try a different approach with fetch
      setMessage((prev) => `${prev}\n\nTesting with different fetch options...`)

      const fetchTests = [
        { name: "no-cors mode", options: { mode: "no-cors" } },
        { name: "cors mode", options: { mode: "cors" } },
        { name: "same-origin mode", options: { mode: "same-origin" } },
      ]

      for (const test of fetchTests) {
        try {
          const response = await fetch("https://beatmatch-jbss.onrender.com", test.options)
          setMessage((prev) => `${prev}\n✅ ${test.name}: ${response.status || "success"}`)
        } catch (error) {
          setMessage((prev) => `${prev}\n❌ ${test.name}: ${error.message}`)
        }
      }

      // Test 4: WebSocket test (without socket.io)
      setMessage((prev) => `${prev}\n\nTesting raw WebSocket connection...`)

      try {
        const ws = new WebSocket("wss://beatmatch-jbss.onrender.com/socket.io/?EIO=4&transport=websocket")

        const wsTest = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close()
            reject(new Error("WebSocket timeout"))
          }, 5000)

          ws.onopen = () => {
            clearTimeout(timeout)
            setMessage((prev) => `${prev}\n✅ Raw WebSocket connection works`)
            ws.close()
            resolve("success")
          }

          ws.onerror = (error) => {
            clearTimeout(timeout)
            reject(new Error("WebSocket error"))
          }
        })

        await wsTest
        setStatus("success")
      } catch (wsError) {
        setMessage((prev) => `${prev}\n❌ Raw WebSocket failed: ${wsError.message}`)
        setStatus("error")
      }
    } catch (error) {
      console.error("Simple test error:", error)
      setStatus("error")
      setMessage(
        (prev) => `${prev}\n❌ Simple test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Connection Diagnostics</span>
          {status === "success" && <Badge className="bg-green-500">Connected</Badge>}
          {status === "error" && <Badge variant="destructive">Failed</Badge>}
          {status === "loading" && <Badge className="bg-blue-500">Testing</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center space-x-2">
          <Button onClick={testConnection} disabled={status === "loading"} className="flex-1">
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Full Diagnostic"
            )}
          </Button>
          <Button onClick={testSimpleConnection} disabled={status === "loading"} variant="outline" className="flex-1">
            Simple Test
          </Button>
        </div>

        {message && (
          <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{message}</div>
        )}

        {socketId && (
          <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">Socket ID:</span>
            </div>
            <code className="text-xs bg-green-100 p-1 rounded">{socketId}</code>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground">
          <p>Comprehensive diagnostics to identify connection issues.</p>
          <p>Check the detailed log above for specific problems.</p>
        </div>
      </CardContent>
    </Card>
  )
}
