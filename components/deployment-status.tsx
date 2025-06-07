"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Globe, Server, Wifi } from "lucide-react"

export function DeploymentStatus() {
  const [status, setStatus] = useState({
    frontend: { status: "checking", url: "" },
    backend: { status: "checking", url: "" },
    socket: { status: "checking", connected: false },
  })

  useEffect(() => {
    checkDeploymentStatus()
  }, [])

  const checkDeploymentStatus = async () => {
    // Check frontend
    const frontendUrl = window.location.origin
    setStatus((prev) => ({
      ...prev,
      frontend: { status: "success", url: frontendUrl },
    }))

    // Check backend
    try {
      const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://beatmatch-jbss.onrender.com"
      const response = await fetch(`${backendUrl}/health`)
      const data = await response.json()

      if (data.status === "OK") {
        setStatus((prev) => ({
          ...prev,
          backend: { status: "success", url: backendUrl },
        }))
      } else {
        setStatus((prev) => ({
          ...prev,
          backend: { status: "error", url: backendUrl },
        }))
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        backend: { status: "error", url: "https://beatmatch-jbss.onrender.com" },
      }))
    }

    // Check socket connection
    try {
      const { io } = await import("socket.io-client")
      const testSocket = io("https://beatmatch-jbss.onrender.com", {
        timeout: 5000,
        forceNew: true,
      })

      testSocket.on("connect", () => {
        setStatus((prev) => ({
          ...prev,
          socket: { status: "success", connected: true },
        }))
        testSocket.disconnect()
      })

      testSocket.on("connect_error", () => {
        setStatus((prev) => ({
          ...prev,
          socket: { status: "error", connected: false },
        }))
      })
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        socket: { status: "error", connected: false },
      }))
    }
  }

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case "success":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Online
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        )
      default:
        return <Badge variant="secondary">Checking...</Badge>
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Deployment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Frontend</span>
            </div>
            {getStatusBadge(status.frontend.status)}
          </div>
          <p className="text-xs text-muted-foreground ml-6">{status.frontend.url}</p>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-green-500" />
              <span className="font-medium">Backend</span>
            </div>
            {getStatusBadge(status.backend.status)}
          </div>
          <p className="text-xs text-muted-foreground ml-6">{status.backend.url}</p>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Socket Connection</span>
            </div>
            {getStatusBadge(status.socket.status)}
          </div>
        </div>

        <Button onClick={checkDeploymentStatus} className="w-full" variant="outline">
          Refresh Status
        </Button>

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>✅ Frontend: Vercel</p>
          <p>✅ Backend: Render</p>
          <p>✅ API: Spotify</p>
        </div>
      </CardContent>
    </Card>
  )
}
