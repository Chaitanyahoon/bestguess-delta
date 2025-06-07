"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2, RefreshCw, CheckCircle } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface RoomJoinerProps {
  roomId: string
  playerName: string
  isHost: boolean
  onJoinSuccess: (data: any) => void
  onJoinError: (error: string) => void
}

export function RoomJoiner({ roomId, playerName, isHost, onJoinSuccess, onJoinError }: RoomJoinerProps) {
  const [joinState, setJoinState] = useState<"idle" | "connecting" | "joining" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [logs, setLogs] = useState<string[]>([])

  const { socket, isConnected, isConnecting, error, connectionAttempts, reconnect } = useSocket()

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev.slice(-9), logMessage])
  }, [])

  const attemptJoinRoom = useCallback(async () => {
    if (!roomId || !playerName) {
      const error = "Missing room ID or player name"
      setErrorMessage(error)
      onJoinError(error)
      return
    }

    try {
      setJoinState("connecting")
      addLog("Starting join process...")

      // Wait for socket connection with longer timeout
      addLog("Waiting for socket connection...")

      let connectedSocket = socket

      // If not connected, wait for connection with longer timeout
      if (!isConnected) {
        addLog("Socket not connected, waiting...")

        const maxWaitTime = 30000 // 30 seconds
        const startTime = Date.now()

        while (!isConnected && Date.now() - startTime < maxWaitTime) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          connectedSocket = socket
          if (connectedSocket?.connected) {
            break
          }
        }

        if (!connectedSocket?.connected) {
          throw new Error("Failed to establish socket connection within 30 seconds")
        }
      }

      addLog(`Socket connected: ${connectedSocket.id}`)
      setJoinState("joining")

      // Set up response handlers with longer timeout
      const joinPromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Join request timeout - server did not respond within 15 seconds"))
        }, 15000)

        const handleRoomUpdated = (data: any) => {
          clearTimeout(timeout)
          connectedSocket.off("room-updated", handleRoomUpdated)
          connectedSocket.off("room-error", handleRoomError)
          addLog(`Successfully joined room: ${data.players?.length || 0} players`)
          resolve(data)
        }

        const handleRoomError = (error: any) => {
          clearTimeout(timeout)
          connectedSocket.off("room-updated", handleRoomUpdated)
          connectedSocket.off("room-error", handleRoomError)
          addLog(`Room error: ${error.message || error}`)
          reject(new Error(error.message || error))
        }

        connectedSocket.once("room-updated", handleRoomUpdated)
        connectedSocket.once("room-error", handleRoomError)

        // Send join request with validation
        const roomData = {
          roomId: roomId.toUpperCase().trim(),
          playerName: playerName.trim(),
          isHost,
        }

        addLog(`Sending join request: ${JSON.stringify(roomData)}`)

        try {
          connectedSocket.emit("join-room", roomData)
          addLog("Join request sent successfully")
        } catch (emitError) {
          clearTimeout(timeout)
          reject(new Error(`Failed to send join request: ${emitError}`))
        }
      })

      const result = await joinPromise
      setJoinState("success")
      onJoinSuccess(result)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred"
      addLog(`Join failed: ${errorMsg}`)
      setJoinState("error")
      setErrorMessage(errorMsg)
      onJoinError(errorMsg)
    }
  }, [roomId, playerName, isHost, socket, isConnected, onJoinSuccess, onJoinError, addLog])

  const handleRetry = useCallback(() => {
    setJoinState("idle")
    setErrorMessage("")
    setLogs([])

    if (!isConnected) {
      addLog("Reconnecting socket...")
      reconnect()
      setTimeout(attemptJoinRoom, 3000)
    } else {
      attemptJoinRoom()
    }
  }, [isConnected, reconnect, attemptJoinRoom, addLog])

  const getStatusDisplay = () => {
    if (joinState === "connecting" || isConnecting) {
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        text: "Connecting to server...",
        color: "text-blue-600",
      }
    }

    if (joinState === "joining") {
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        text: "Joining room...",
        color: "text-blue-600",
      }
    }

    if (joinState === "success") {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        text: "Successfully joined!",
        color: "text-green-600",
      }
    }

    if (joinState === "error" || error) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        text: errorMessage || error || "Connection failed",
        color: "text-red-600",
      }
    }

    return {
      icon: <RefreshCw className="w-5 h-5" />,
      text: "Ready to join",
      color: "text-gray-600",
    }
  }

  const status = getStatusDisplay()
  const canJoin = joinState === "idle" && !isConnecting
  const canRetry = joinState === "error" || (!isConnected && !isConnecting)

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <span className={status.color}>{status.icon}</span>
            <span className={`font-medium ${status.color}`}>{status.text}</span>
          </div>

          {connectionAttempts > 0 && (
            <div className="text-center text-sm text-muted-foreground">Connection attempts: {connectionAttempts}</div>
          )}

          <div className="flex space-x-2">
            {canJoin && (
              <Button onClick={attemptJoinRoom} className="flex-1" disabled={!socket}>
                Join Room {roomId}
              </Button>
            )}

            {canRetry && (
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>

          {/* Debug logs */}
          <div className="bg-gray-100 p-2 rounded text-xs max-h-24 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="font-mono text-xs">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">No logs yet</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
