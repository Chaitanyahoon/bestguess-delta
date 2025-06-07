"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Music, Users, Crown, Play, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { RoomJoiner } from "@/components/room-joiner"
import { useSocket } from "@/hooks/use-socket"

interface Player {
  id: string
  name: string
  score: number
  isHost: boolean
}

export default function GameRoom() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const playerName = searchParams.get("name") || ""
  const isHost = searchParams.get("host") === "true"

  const [players, setPlayers] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const { socket, isConnected, error } = useSocket()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev.slice(-9), logMessage])
  }

  useEffect(() => {
    if (!roomId || !playerName) {
      router.push("/")
      return
    }

    if (roomId.length !== 6) {
      router.push("/")
      return
    }
  }, [roomId, playerName, router])

  const handleJoinSuccess = (data: any) => {
    addLog("Join successful")
    console.log("Join successful:", data)
    setPlayers(data.players || [])
    setHasJoined(true)
    setJoinError(null)
  }

  const handleJoinError = (error: string) => {
    addLog(`Join failed: ${error}`)
    console.error("Join failed:", error)
    setJoinError(error)
    setHasJoined(false)
  }

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startGame = () => {
    if (!socket || !hasJoined) {
      addLog("Cannot start game - not connected or not joined")
      return
    }

    if (players.length < 2) {
      addLog("Cannot start game - need at least 2 players")
      return
    }

    addLog("Starting game...")
    socket.emit("start-game", { roomId })

    // Add timeout for game start
    setTimeout(() => {
      addLog("Game start timeout - checking if game started...")
    }, 10000)
  }

  const currentPlayer = players.find((p) => p.name === playerName)
  const hostPlayer = players.find((p) => p.isHost)

  useEffect(() => {
    if (!socket || !hasJoined) {
      return
    }

    addLog("Setting up room socket listeners")

    const handleRoomUpdated = (data: any) => {
      addLog(`Room updated: ${data.players?.length || 0} players`)
      console.log("Room updated:", data)
      setPlayers(data.players || [])
      setJoinError(null)
    }

    const handleGameStarted = () => {
      addLog("Game started, redirecting...")
      console.log("Game started, redirecting...")
      router.push(`/game/${roomId}?name=${encodeURIComponent(playerName)}`)
    }

    const handleRoomError = (error: any) => {
      addLog(`Room error: ${error.message || error}`)
      console.error("Room error:", error)
      setJoinError(error.message || error)
    }

    socket.on("room-updated", handleRoomUpdated)
    socket.on("game-started", handleGameStarted)
    socket.on("room-error", handleRoomError)

    // Request current room state when socket is ready
    if (isConnected) {
      addLog("Requesting current room state...")
      socket.emit("get-room-state", { roomId })
    }

    return () => {
      addLog("Cleaning up room socket listeners")
      socket.off("room-updated", handleRoomUpdated)
      socket.off("game-started", handleGameStarted)
      socket.off("room-error", handleRoomError)
    }
  }, [socket, hasJoined, roomId, playerName, router, isConnected])

  if (!roomId || !playerName) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">Game Room</h1>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg font-mono font-bold">{roomId}</span>
                  <Button variant="ghost" size="sm" onClick={copyRoomId} className="h-8 w-8 p-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Share this room ID with your friends</p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Connection Issue</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error || "Not connected to server"}</p>
              </CardContent>
            </Card>
          )}

          {/* Room Joiner Component */}
          {!hasJoined && (
            <RoomJoiner
              roomId={roomId}
              playerName={playerName}
              isHost={isHost}
              onJoinSuccess={handleJoinSuccess}
              onJoinError={handleJoinError}
            />
          )}

          {/* Players List - Only show when joined */}
          {hasJoined && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Players in Room ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        player.name === playerName ? "bg-primary/10 border border-primary/20" : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{player.name}</span>
                            {player.name === playerName && (
                              <Badge variant="secondary" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {player.isHost && <Badge variant="outline">Host</Badge>}
                    </div>
                  ))}
                </div>

                {players.length < 2 && (
                  <div className="text-center mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">Waiting for more players... (minimum 2 players required)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Host Controls - Only show when joined and is host */}
          {hasJoined && isHost && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Host Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={startGame}
                  disabled={players.length < 2 || !isConnected}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
                {players.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">Need at least 2 players to start</p>
                )}
                {!isConnected && (
                  <p className="text-sm text-red-600 text-center mt-2">Cannot start - not connected to server</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Player Waiting - Only show when joined and not host */}
          {hasJoined && !isHost && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Waiting for Host</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Waiting for {hostPlayer?.name || "the host"} to start the game...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Debug Logs */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2 text-sm">Room Logs:</h3>
              <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Back to Home Button */}
          <div className="text-center">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
