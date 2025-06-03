"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bug, ChevronDown, ChevronUp } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface DebugPanelProps {
  roomId?: string
  playerName?: string
  isHost?: boolean
}

export function DebugPanel({ roomId, playerName, isHost }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const { socket, isConnected, error } = useSocket()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`])
  }

  const testConnection = () => {
    if (socket) {
      addLog("Testing connection...")
      socket.emit("ping")
      socket.once("pong", () => addLog("✅ Ping successful"))
    } else {
      addLog("❌ No socket connection")
    }
  }

  const testJoinRoom = () => {
    if (socket && roomId && playerName) {
      addLog(`Attempting to join room: ${roomId}`)
      socket.emit("join-room", { roomId, playerName, isHost })
    } else {
      addLog("❌ Missing socket, roomId, or playerName")
    }
  }

  if (process.env.NODE_ENV === "production") {
    return null // Hide in production
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Bug className="w-4 h-4 mr-2" />
              Debug Panel
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="h-6 w-6 p-0">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>

        {isOpen && (
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Socket:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Room ID:</span>
                <Badge variant="outline">{roomId || "None"}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Player:</span>
                <Badge variant="outline">{playerName || "None"}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Host:</span>
                <Badge variant={isHost ? "default" : "secondary"}>{isHost ? "Yes" : "No"}</Badge>
              </div>

              {error && (
                <div className="flex items-center justify-between">
                  <span>Error:</span>
                  <Badge variant="destructive">{error}</Badge>
                </div>
              )}

              <div className="flex space-x-1 mt-3">
                <Button size="sm" onClick={testConnection} className="text-xs h-6">
                  Ping
                </Button>
                <Button size="sm" onClick={testJoinRoom} className="text-xs h-6">
                  Join
                </Button>
                <Button size="sm" onClick={() => setLogs([])} variant="outline" className="text-xs h-6">
                  Clear
                </Button>
              </div>

              {logs.length > 0 && (
                <div className="mt-3 p-2 bg-muted rounded text-xs max-h-32 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
