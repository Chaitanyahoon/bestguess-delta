"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Copy, Check, Music, AlertCircle, RefreshCw } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { PlayerList } from "@/components/player-list"
import { Badge } from "@/components/ui/badge"

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
  const [gameStarted, setGameStarted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [joinAttempts, setJoinAttempts] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const hasJoinedRef = useRef(false)

  const { socket, isConnected, error } = useSocket()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev.slice(-9), logMessage])
  }

  const attemptJoinRoom = () => {
    if (!socket || !isConnected || !playerName || hasJoinedRef.current) {
      addLog(
        `Cannot join: socket=${!!socket}, connected=${isConnected}, name=${!!playerName}, hasJoined=${hasJoinedRef.current}`,
      )
      return
    }

    addLog(`Attempting to join room ${roomId} as ${playerName} (host: ${isHost})`)
    setJoinAttempts((prev) => prev + 1)

    socket.emit("join-room", {
      roomId: roomId.toUpperCase(),
      playerName: playerName.trim(),
      isHost,
    })

    hasJoinedRef.current = true
  }

  useEffect(() => {
    if (!roomId || !playerName) {
      setRoomError("Missing room ID or player name")
      return
    }

    if (roomId.length !== 6) {
      setRoomError("Invalid room code format")
      return
    }

    addLog("Room component mounted")
  }, [roomId, playerName])

  useEffect(() => {
    if (!socket) {
      addLog("No socket available")
      return
    }

    addLog("Setting up socket listeners")

    const handleRoomUpdated = (data: any) => {
      addLog(`Room updated: ${data.players?.length || 0} players`)
      setPlayers(data.players || [])
      setRoomError(null)
    }

    const handleGameStarted = () => {
      addLog("Game started, redirecting...")
      setGameStarted(true)
      router.push(`/game/${roomId}?name=${encodeURIComponent(playerName)}`)
    }

    const handleRoomError = (error: any) => {
      addLog(`Room error: ${error.message}`)
      setRoomError(error.message)
      hasJoinedRef.current = false
    }

    const handleConnect = () => {
      addLog("Socket connected, attempting to join room")
      hasJoinedRef.current = false
      setTimeout(attemptJoinRoom, 1000) // Small delay to ensure connection is stable
    }

    const handleDisconnect = () => {
      addLog("Socket disconnected")
      hasJoinedRef.current = false
    }

    socket.on("room-updated", handleRoomUpdated)
    socket.on("game-started", handleGameStarted)
    socket.on("room-error", handleRoomError)
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    // If already connected, try to join
    if (isConnected) {
      addLog("Socket already connected, attempting to join")
      setTimeout(attemptJoinRoom, 500)
    }

    return () => {
      addLog("Cleaning up socket listeners")
      socket.off("room-updated", handleRoomUpdated)
      socket.off("game-started", handleGameStarted)
      socket.off("room-error", handleRoomError)
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
    }
  }, [socket, isConnected, roomId, playerName, isHost, router])

  const startGame = () => {
    if (socket && players.length >= 2) {
      addLog("Starting game...")
      socket.emit("start-game", roomId.toUpperCase())
    } else {
      addLog(`Cannot start game: socket=${!!socket}, players=${players.length}`)
    }
  }

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const retryJoin = () => {
    addLog("Manual retry join")
    hasJoinedRef.current = false
    setRoomError(null)
    attemptJoinRoom()
  }

  const currentPlayer = players.find((p) => p.name === playerName)
  const hostPlayer = players.find((p) => p.isHost)

  if (roomError && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connection Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Cannot connect to server"}</p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/")} className="w-full">
                Back to Home
              </Button>
              <Button onClick={() => router.push("/test")} variant="outline" className="w-full">
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Connection Status */}
          <div className="mb-4 flex justify-between items-center">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="outline">Attempts: {joinAttempts}</Badge>
          </div>

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

          {roomError && (
            <Card className="mb-6 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700">{roomError}</span>
                  </div>
                  <Button onClick={retryJoin} size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <PlayerList players={players} currentPlayerName={playerName} showScores={false} title="Players in Room" />

            {players.length < 2 && (
              <CardContent>
                <div className="text-center mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">Waiting for more players... (minimum 2 players required)</p>
                </div>
              </CardContent>
            )}
          </Card>

          {currentPlayer?.isHost && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Button
                  onClick={startGame}
                  disabled={players.length < 2}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
                {players.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">Need at least 2 players to start</p>
                )}
              </CardContent>
            </Card>
          )}

          {!currentPlayer?.isHost && players.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Waiting for {hostPlayer?.name} to start the game...</p>
              </CardContent>
            </Card>
          )}

          {/* Debug Logs */}
          {process.env.NODE_ENV === "development" && logs.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Debug Logs:</h3>
                <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
