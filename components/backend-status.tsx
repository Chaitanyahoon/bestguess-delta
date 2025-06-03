"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, ExternalLink, AlertTriangle, Clock, Zap } from "lucide-react"

export function BackendStatus() {
  const [status, setStatus] = useState("checking")
  const [message, setMessage] = useState("Checking backend status...")
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [isWakingUp, setIsWakingUp] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const checkBackendStatus = async (isRetry = false) => {
    if (!isRetry) {
      setStatus("checking")
      setMessage("Checking backend status...")
      setRetryCount(0)
    }

    try {
      // Method 1: Try a simple fetch with timeout
      setMessage("Testing backend connectivity...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const startTime = Date.now()

      try {
        const response = await fetch("https://beatmatch-jbss.onrender.com", {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const endTime = Date.now()
        const responseTime = endTime - startTime

        setStatus("online")
        setMessage(`✅ Backend server is online (${responseTime}ms response time)`)
        setLastCheck(new Date())
        setIsWakingUp(false)
        return true
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError.name === "AbortError") {
          // Timeout - likely a cold start
          setMessage("⏳ Backend timeout - likely cold start. Attempting to wake up server...")
          setIsWakingUp(true)
          return await attemptWakeUp()
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error("Backend status check failed:", error)
      setStatus("offline")
      setMessage(`❌ Backend appears to be offline: ${error.message}`)
      setLastCheck(new Date())
      setIsWakingUp(false)
      return false
    }
  }

  const attemptWakeUp = async () => {
    setIsWakingUp(true)
    setMessage("🚀 Attempting to wake up backend server (this may take 30-60 seconds)...")

    // Try multiple wake-up requests
    const wakeUpPromises = []

    for (let i = 0; i < 3; i++) {
      wakeUpPromises.push(
        fetch("https://beatmatch-jbss.onrender.com", {
          method: "GET",
          mode: "no-cors",
        }).catch(() => null), // Ignore errors, we just want to trigger the server
      )
    }

    // Send wake-up requests
    await Promise.allSettled(wakeUpPromises)

    // Wait a bit for the server to start
    setMessage("⏳ Waiting for server to start up...")
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Now try to check status again with retries
    for (let attempt = 1; attempt <= 6; attempt++) {
      setMessage(`🔄 Checking server status (attempt ${attempt}/6)...`)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const startTime = Date.now()
        const response = await fetch("https://beatmatch-jbss.onrender.com", {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const endTime = Date.now()
        const responseTime = endTime - startTime

        setStatus("online")
        setMessage(`✅ Backend server is now online! (${responseTime}ms response time)`)
        setLastCheck(new Date())
        setIsWakingUp(false)
        return true
      } catch (error) {
        if (attempt < 6) {
          setMessage(`⏳ Attempt ${attempt} failed, retrying in 10 seconds...`)
          await new Promise((resolve) => setTimeout(resolve, 10000))
        }
      }
    }

    // If we get here, all attempts failed
    setStatus("offline")
    setMessage("❌ Failed to wake up backend server after multiple attempts")
    setIsWakingUp(false)
    return false
  }

  const forceWakeUp = async () => {
    setRetryCount((prev) => prev + 1)
    await attemptWakeUp()
  }

  useEffect(() => {
    checkBackendStatus()
  }, [])

  const getStatusBadge = () => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">Online</Badge>
      case "offline":
        return <Badge variant="destructive">Offline</Badge>
      case "checking":
        return <Badge className="bg-blue-500">Checking</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Backend Status</span>
          <div className="flex items-center space-x-2">
            {isWakingUp && <Clock className="w-4 h-4 text-blue-500 animate-pulse" />}
            {getStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-gray-50 rounded text-sm">
          {message}
          {lastCheck && (
            <div className="text-xs text-muted-foreground mt-2">Last checked: {lastCheck.toLocaleTimeString()}</div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => checkBackendStatus()}
            disabled={status === "checking" || isWakingUp}
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${status === "checking" ? "animate-spin" : ""}`} />
            {isWakingUp ? "Waking Up..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://beatmatch-jbss.onrender.com", "_blank")}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Backend
          </Button>
        </div>

        {status === "offline" && !isWakingUp && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Backend Server Offline</p>
                  <p className="text-red-600 mt-1">The backend server is not responding. Common causes:</p>
                  <ul className="list-disc list-inside text-red-600 mt-2 space-y-1">
                    <li>
                      <strong>Cold Start:</strong> Render.com puts free servers to sleep after 15 minutes of inactivity
                    </li>
                    <li>
                      <strong>Server Error:</strong> The backend application may have crashed
                    </li>
                    <li>
                      <strong>Deployment:</strong> Server might be updating or redeploying
                    </li>
                    <li>
                      <strong>Network Issues:</strong> Connectivity problems between services
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={forceWakeUp} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isWakingUp}>
              <Zap className="w-4 h-4 mr-2" />
              Wake Up Server (Attempt {retryCount + 1})
            </Button>
          </div>
        )}

        {isWakingUp && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-start">
              <Clock className="w-4 h-4 text-blue-500 mr-2 mt-0.5 animate-pulse" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Waking Up Server</p>
                <p className="text-blue-600 mt-1">
                  Render.com free tier servers go to sleep after inactivity. The first request can take 30-60 seconds to
                  wake up the server. Please be patient!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>Backend URL: https://beatmatch-jbss.onrender.com</p>
          <p>Hosted on Render.com (Free Tier)</p>
        </div>
      </CardContent>
    </Card>
  )
}
