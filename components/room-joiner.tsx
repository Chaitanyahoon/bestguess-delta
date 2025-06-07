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

  const { socket, isConnected, isConnecting, error, connectionAttempts, reconnect, waitForConnection } = useSocket()

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

      // Wait for socket connection
      addLog("Waiting for socket connection...")
      const connectedSocket = await waitForConnection(15000)

      if (!connectedSocket) {
        throw new Error("Failed to establish socket connection")
      }

      addLog(`Socket connected: ${connectedSocket.id}`)
      setJoinState("joining")

      // Set up response handlers
      const joinPromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Join request timeout - server did not respond"))
        }, 10000)

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
          addLog(`Room error: ${error.message}`)
          reject(new Error(error.message))
        }

        connectedSocket.once("room-updated", handleRoomUpdated)
        connectedSocket.once("room-error", handleRoomError)

        // Send join request
        addLog(`Sending join request for room ${roomId}`)
        connectedSocket.emit("join-room", {
          roomId: roomId.toUpperCase(),
          playerName: playerName.trim(),
          isHost,
        })
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
  }, [roomId, playerName, isHost, waitForConnection, onJoinSuccess, onJoinError, addLog])

  const handleRetry = useCallback(() => {
    setJoinState("idle")
    setErrorMessage("")
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
              <Button onClick={attemptJoinRoom} className="flex-1" disabled={!isConnected}>
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
