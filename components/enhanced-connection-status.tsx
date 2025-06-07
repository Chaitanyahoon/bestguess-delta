"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

export function EnhancedConnectionStatus() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [pingTime, setPingTime] = useState<number | null>(null)
  const [lastPing, setLastPing] = useState<Date | null>(null)
  const { socket, isConnected, error } = useSocket()

  useEffect(() => {
    if (!socket) return

    const pingInterval = setInterval(() => {
      if (isConnected) {
        const start = Date.now()
        socket.emit("ping")
        socket.once("pong", () => {
          const duration = Date.now() - start
          setPingTime(duration)
          setLastPing(new Date())
        })
      }
    }, 10000) // Ping every 10 seconds

    return () => clearInterval(pingInterval)
  }, [socket, isConnected])

  const testConnection = () => {
    if (socket && isConnected) {
      const start = Date.now()
      socket.emit("ping")
      socket.once("pong", () => {
        const duration = Date.now() - start
        setPingTime(duration)
        setLastPing(new Date())
      })
    }
  }

  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        variant: "destructive" as const,
        icon: <WifiOff className="w-4 h-4 mr-1" />,
        text: "Disconnected",
        color: "text-red-500",
      }
    }

    if (pingTime === null) {
      return {
        variant: "secondary" as const,
        icon: <Wifi className="w-4 h-4 mr-1" />,
        text: "Connected",
        color: "text-green-500",
      }
    }

    if (pingTime < 100) {
      return {
        variant: "default" as const,
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
        text: "Excellent",
        color: "text-green-500",
      }
    }

    if (pingTime < 300) {
      return {
        variant: "secondary" as const,
        icon: <Wifi className="w-4 h-4 mr-1" />,
        text: "Good",
        color: "text-blue-500",
      }
    }

    return {
      variant: "warning" as const,
      icon: <AlertTriangle className="w-4 h-4 mr-1" />,
      text: "Slow",
      color: "text-yellow-500",
    }
  }

  const status = getStatusInfo()

  if (!isExpanded) {
    return (
      <Badge
        variant={status.variant}
        className="fixed top-4 right-4 z-50 cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        {status.icon}
        {status.text}
      </Badge>
    )
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-64 shadow-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Connection Status</h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsExpanded(false)}>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span>Status:</span>
            <Badge variant={status.variant}>
              {status.icon}
              {status.text}
            </Badge>
          </div>

          {pingTime !== null && (
            <div className="flex justify-between items-center">
              <span>Ping:</span>
              <span className={status.color}>{pingTime}ms</span>
            </div>
          )}

          {lastPing && (
            <div className="flex justify-between items-center">
              <span>Last Check:</span>
              <span className="text-xs text-muted-foreground">{lastPing.toLocaleTimeString()}</span>
            </div>
          )}

          {error && <div className="bg-red-50 p-2 rounded text-xs text-red-600">{error}</div>}

          <Button size="sm" variant="outline" className="w-full mt-2" onClick={testConnection} disabled={!isConnected}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
