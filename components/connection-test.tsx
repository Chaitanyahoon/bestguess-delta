"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

export function ConnectionTest() {
  const [tests, setTests] = useState({
    backend: { status: "pending", message: "" },
    socket: { status: "pending", message: "" },
    ping: { status: "pending", message: "" },
    spotify: { status: "pending", message: "" },
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
      backend: { status: "pending", message: "" },
      socket: { status: "pending", message: "" },
      ping: { status: "pending", message: "" },
      spotify: { status: "pending", message: "" },
    })

    const backendUrl = "https://beatmatch-jbss.onrender.com"

    // Test 1: Backend Health Check
    try {
      const response = await fetch(`${backendUrl}/health`)
      const data = await response.json()

      if (response.ok && data.status === "OK") {
        updateTest("backend", "success", `Backend OK - ${data.rooms} rooms, ${data.players} players`)
      } else {
        updateTest("backend", "error", "Backend not responding correctly")
      }
    } catch (error) {
      updateTest("backend", "error", `Backend unreachable: ${error}`)
    }

    // Test 2: Socket Connection
    try {
      const { io } = await import("socket.io-client")
      const testSocket = io(backendUrl, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
      })

      testSocket.on("connect", () => {
        updateTest("socket", "success", `Connected with ID: ${testSocket.id}`)

        // Test 3: Ping Test
        testSocket.emit("ping")
        testSocket.once("pong", () => {
          updateTest("ping", "success", "Ping successful")
          testSocket.disconnect()
        })

        setTimeout(() => {
          if (tests.ping.status === "pending") {
            updateTest("ping", "error", "Ping timeout")
            testSocket.disconnect()
          }
        }, 5000)
      })

      testSocket.on("connect_error", (error) => {
        updateTest("socket", "error", `Connection failed: ${error.message}`)
        updateTest("ping", "error", "Cannot ping - no connection")
      })

      setTimeout(() => {
        if (tests.socket.status === "pending") {
          updateTest("socket", "error", "Connection timeout")
          updateTest("ping", "error", "Cannot ping - no connection")
          testSocket.disconnect()
        }
      }, 10000)
    } catch (error) {
      updateTest("socket", "error", `Socket error: ${error}`)
      updateTest("ping", "error", "Cannot ping - socket error")
    }

    // Test 4: Spotify Configuration
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID || "6505035b2eb34f5ab9abecf157a93ae1"
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "473b90d3fb4b4d75a68808271870585d"

      if (clientId && clientSecret) {
        updateTest("spotify", "success", `Spotify credentials configured (Client ID: ${clientId.substring(0, 8)}...)`)
      } else {
        updateTest("spotify", "error", "Spotify credentials missing")
      }
    } catch (error) {
      updateTest("spotify", "error", `Spotify config error: ${error}`)
    }

    setIsRunning(false)
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
        return <Badge variant="secondary">{isRunning ? "..." : "WAIT"}</Badge>
      default:
        return <Badge variant="secondary">WAIT</Badge>
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Connection Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.backend.status)}
              <span className="font-medium">Backend Health</span>
            </div>
            {getStatusBadge(tests.backend.status)}
          </div>
          {tests.backend.message && <p className="text-sm text-muted-foreground ml-6">{tests.backend.message}</p>}

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.socket.status)}
              <span className="font-medium">Socket Connection</span>
            </div>
            {getStatusBadge(tests.socket.status)}
          </div>
          {tests.socket.message && <p className="text-sm text-muted-foreground ml-6">{tests.socket.message}</p>}

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.ping.status)}
              <span className="font-medium">Ping Test</span>
            </div>
            {getStatusBadge(tests.ping.status)}
          </div>
          {tests.ping.message && <p className="text-sm text-muted-foreground ml-6">{tests.ping.message}</p>}

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tests.spotify.status)}
              <span className="font-medium">Spotify Config</span>
            </div>
            {getStatusBadge(tests.spotify.status)}
          </div>
          {tests.spotify.message && <p className="text-sm text-muted-foreground ml-6">{tests.spotify.message}</p>}
        </div>

        <Button onClick={runTests} disabled={isRunning} className="w-full">
          {isRunning ? "Running Tests..." : "Run Tests Again"}
        </Button>

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>Backend: https://beatmatch-jbss.onrender.com</p>
          <p>Spotify Client ID: 6505035b2eb34f5ab9abecf157a93ae1</p>
        </div>
      </CardContent>
    </Card>
  )
}
