"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

export function ConnectionStatus() {
  const { socket, isConnected, error, isConnecting, reconnect } = useSocket()
  const [showReconnect, setShowReconnect] = useState(false)

  useEffect(() => {
    if (error && !isConnecting) {
      setShowReconnect(true)
    } else {
      setShowReconnect(false)
    }
  }, [error, isConnecting])

  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        variant: "secondary" as const,
        icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
        text: "Connecting...",
      }
    }

    if (error) {
      return {
        variant: "destructive" as const,
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
        text: "Error",
      }
    }

    if (isConnected) {
      return {
        variant: "default" as const,
        icon: <Wifi className="w-3 h-3 mr-1" />,
        text: "Connected",
      }
    }

    return {
      variant: "destructive" as const,
      icon: <WifiOff className="w-3 h-3 mr-1" />,
      text: "Disconnected",
    }
  }

  const status = getStatusInfo()

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
      <Badge variant={status.variant}>
        {status.icon}
        {status.text}
      </Badge>
      {showReconnect && (
        <Button onClick={reconnect} size="sm" variant="outline" className="h-6 px-2 text-xs">
          <RefreshCw className="w-3 h-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  )
}
