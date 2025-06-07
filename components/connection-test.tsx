"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"

export function ConnectionTest() {
  const [tests, setTests] = useState({
    backend: { status: "pending", message: "" },
    socket: { status: "pending", message: "" },
    ping: { status: "pending", message: "" },
    join: { status: "pending", message: "" },
  })
  const [isRunning, setIsRunning] = useState(false)
  const [corsTest, setCorsTest] = useState({ status: "pending", message: "" })
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev.slice(-9), logMessage])
  }

  const updateTest = (test: string, status: string, message: string) => {
    setTests((prev) => ({
      ...prev,
      [test]: { status, message },
    }))
  }

  const runTests = async () => {
    setIsRunning(true)
    addLog("Starting connection tests...")

    // Reset tests
    setTests({
      backend: { status: "pending", message: "" },
      socket: { status: "pending", message: "" },
      ping: { status: "pending", message: "" },
      join: { status: "pending", message: "" },
    })
    setCorsTest({ status: "pending", message: "" })

    // Test 1: Backend Health Check
    try {
      addLog("Testing backend health...")
      // Update the backend URL
      const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://beatmatch-jbss.onrender.com"
      const response = await fetch(`${backendUrl}/health`, {
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
      })
      const data = await response.json()

      if (response.ok && data.status === "OK") {
        updateTest("backend", "success", `Backend OK - ${data.rooms} rooms, ${data.players} players`)
        addLog(`Backend health check passed: ${data.rooms} rooms, ${data.players} players`)
      } else {
        updateTest("backend", "error", "Backend not responding correctly")
        addLog("Backend health check failed: not responding correctly")
      }
    } catch (error) {
      updateTest("backend", "error", `Backend unreachable: ${error}`)
      addLog(`Backend health check failed: ${error}`)
    }

    // Test CORS
    try {
      addLog("Testing CORS configuration...")
      const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://beatmatch-jbss.onrender.com"
      const response = await fetch(`${backendUrl}/`, {
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
      })

      if (response.ok) {
        setCorsTest({ status: "success", message: "CORS is properly configured" })
        addLog("CORS test passed")
      } else {
        setCorsTest({ status: "error", message: "CORS test failed" })
        addLog("CORS test failed")
      }
    } catch (error) {
      setCorsTest({ status: "error", message: `CORS error: ${error}` })
      addLog(`CORS test failed: ${error}`)
    }

    // Test 2: Socket Connection
    try {
      addLog("Testing socket connection...")
      const { io } = await import("socket.io-client")
      const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://beatmatch-jbss.onrender.com"
      // Also update the socket connection test
      const testSocket = io(backendUrl, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        forceNew: true,
        withCredentials: false,
      })

      testSocket.on("connect", () => {
        updateTest("socket", "success", `Connected with ID: ${testSocket.id}`)
        addLog(`Socket connection successful: ${testSocket.id}`)

        // Test 3: Ping Test
        addLog("Testing ping...")
        testSocket.emit("ping")
        testSocket.once("pong", () => {
          updateTest("ping", "success", "Ping successful")
          addLog("Ping test successful")

          // Test 4: Join Room Test
          addLog("Testing room join...")
          const testRoomId = "TEST" + Math.random().toString(36).substring(2, 6).toUpperCase()
          const testPlayerName = "Tester" + Math.floor(Math.random() * 1000)

          testSocket.emit("join-room", {
            roomId: testRoomId,
            playerName: testPlayerName,
            isHost: true,
          })

          testSocket.once("room-updated", (data) => {
            updateTest("join", "success", `Joined test room: ${testRoomId}`)
            addLog(`Room join test successful: ${testRoomId}`)
            testSocket.disconnect()
            setIsRunning(false)
          })

          testSocket.once("room-error", (error) => {
            updateTest("join", "error", `Room join error: ${error.message}`)
            addLog(`Room join test failed: ${error.message}`)
            testSocket.disconnect()
            setIsRunning(false)
          })

          // Set timeout for join test
          setTimeout(() => {
            if (tests.join.status === "pending") {
              updateTest("join", "error", "Room join timeout")
              addLog("Room join test failed: timeout")
              testSocket.disconnect()
              setIsRunning(false)
            }
          }, 5000)
        })

        setTimeout(() => {
          if (tests.ping.status === "pending") {
            updateTest("ping", "error", "Ping timeout")
            addLog("Ping test failed: timeout")
            testSocket.disconnect()
            setIsRunning(false)
          }
        }, 5000)
      })

      testSocket.on("connect_error", (error) => {
        updateTest("socket", "error", `Connection failed: ${error.message}`)
        updateTest("ping", "error", "Cannot ping - no connection")
        updateTest("join", "error", "Cannot join - no connection")
        addLog(`Socket connection failed: ${error.message}`)
        setIsRunning(false)
      })

      setTimeout(() => {
        if (tests.socket.status === "pending") {
          updateTest("socket", "error", "Connection timeout")
          updateTest("ping", "error", "Cannot ping - no connection")
          updateTest("join", "error", "Cannot join - no connection")
          addLog("Socket connection failed: timeout")
          testSocket.disconnect()
          setIsRunning(false)
        }
      }, 5000)
    } catch (error) {
      updateTest("socket", "error", `Socket error: ${error}`)
      updateTest("ping", "error", "Cannot ping - socket error")
      updateTest("join", "error", "Cannot join - socket error")
      addLog(`Socket test failed: ${error}`)
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
              {getStatusIcon(corsTest.status)}
              <span className="font-medium">CORS Configuration</span>
            </div>
            {getStatusBadge(corsTest.status)}
          </div>
          {corsTest.message && <p className="text-sm text-muted-foreground ml-6">{corsTest.message}</p>}

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
              {getStatusIcon(tests.join.status)}
              <span className="font-medium">Room Join Test</span>
            </div>
            {getStatusBadge(tests.join.status)}
          </div>
          {tests.join.message && <p className="text-sm text-muted-foreground ml-6">{tests.join.message}</p>}
        </div>

        <Button onClick={runTests} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Tests Again
            </>
          )}
        </Button>

        <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="font-mono">
              {log}
            </div>
          ))}
        </div>

        <div className="text-xs text-center text-muted-foreground">
          <p>Backend: https://beatmatch-backend.onrender.com</p>
          <p className="mt-1">If tests fail, check if the backend server is running</p>
        </div>
      </CardContent>
    </Card>
  )
}
