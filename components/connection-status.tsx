"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

export function ConnectionStatus() {
  const [isConnecting, setIsConnecting] = useState(true)
  const { socket, isConnected, error } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      setIsConnecting(false)
    }

    const handleDisconnect = () => {
      setIsConnecting(false)
    }

    const handleConnectError = () => {
      setIsConnecting(false)
    }

    const handleReconnecting = () => {
      setIsConnecting(true)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("reconnect_attempt", handleReconnecting)

    // Set initial state
    setIsConnecting(!isConnected)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off("reconnect_attempt", handleReconnecting)
    }
  }, [socket, isConnected])

  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        variant: "secondary" as const,
        icon: <Wifi className="w-3 h-3 mr-1 animate-pulse" />,
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
    <Badge variant={status.variant} className="fixed top-4 right-4 z-50">
      {status.icon}
      {status.text}
    </Badge>
  )
}
