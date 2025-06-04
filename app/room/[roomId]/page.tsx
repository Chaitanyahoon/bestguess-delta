"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Copy, Check, Music, AlertCircle, RefreshCw, Users } from "lucide-react"
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
  const [copied, setCopied] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [joinAttempts, setJoinAttempts] = useState(0)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { socket, isConnected, error } = useSocket()

  const attemptJoinRoom = () => {
    if (!socket || !isConnected || !playerName || hasJoined || isJoining) {
      console.log("Cannot join room:", { socket: !!socket, isConnected, playerName, hasJoined, isJoining })
      return
    }

    console.log(`🚪 Joining room ${roomId} as ${playerName} (host: ${isHost})`)
    setIsJoining(true)
    setJoinAttempts((prev) => prev + 1)
    setRoomError(null)

    // Clear any existing timeout
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current)
    }

    // Set timeout for join attempt
    joinTimeoutRef.current = setTimeout(() => {
      if (isJoining && !hasJoined) {
        console.log("⏰ Join attempt timed out")
        setIsJoining(false)
        setRoomError("Join attempt timed out. Please try again.")
      }
    }, 15000)

    socket.emit("join-room", {
      roomId: roomId.toUpperCase(),
      playerName: playerName.trim(),
      isHost,
    })
  }

  useEffect(() => {
    if (!socket) return

    const handleRoomUpdated = (data: any) => {
      console.log("📊 Room updated:", data)

      if (data.players && Array.isArray(data.players)) {
        setPlayers(data.players)
        setHasJoined(true)
        setIsJoining(false)
        setRoomError(null)

        // Clear join timeout on success
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current)
          joinTimeoutRef.current = null
        }

        console.log(`✅ Successfully joined room with ${data.players.length} players`)
      }
    }

    const handleGameStarted = () => {
      console.log("🎮 Game started, redirecting...")
      router.push(`/game/${roomId}?name=${encodeURIComponent(playerName)}`)
    }

    const handleRoomError = (errorData: any) => {
      console.error("❌ Room error:", errorData)
      setRoomError(errorData.message || "Failed to join room")
      setIsJoining(false)
      setHasJoined(false)

      // Clear join timeout on error
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current)
        joinTimeoutRef.current = null
      }
    }

    socket.on("room-updated", handleRoomUpdated)
    socket.on("game-started", handleGameStarted)
    socket.on("room-error", handleRoomError)

    return () => {
      socket.off("room-updated", handleRoomUpdated)
      socket.off("game-started", handleGameStarted)
      socket.off("room-error", handleRoomError)
    }
  }, [socket, roomId, playerName, router])

  // Auto-join when socket connects
  useEffect(() => {
    if (isConnected && !hasJoined && !isJoining) {
      console.log("🔗 Socket connected, attempting to join room...")
      setTimeout(attemptJoinRoom, 1000) // Small delay to ensure connection is stable
    }
  }, [isConnected, hasJoined, isJoining])

  const startGame = () => {
    if (!socket) {
      alert("No connection to server")
      return
    }

    if (players.length < 2) {
      alert("Need at least 2 players to start the game")
      return
    }

    const currentPlayer = players.find((p) => p.name === playerName)
    if (!currentPlayer?.isHost) {
      alert("Only the host can start the game")
      return
    }

    console.log("🚀 Starting game...")
    socket.emit("start-game", roomId.toUpperCase())
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const retryJoin = () => {
    console.log("🔄 Manual retry join")
    setHasJoined(false)
    setIsJoining(false)
    setRoomError(null)
    setTimeout(attemptJoinRoom, 500)
  }

  const currentPlayer = players.find((p) => p.name === playerName)
  const hostPlayer = players.find((p) => p.isHost)

  // Show error if not connected
  if (!isConnected && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connection Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/")} className="w-full">
                Back to Home
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Retry Connection
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
          {/* Status Bar */}
          <div className="mb-4 flex justify-between items-center">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <div className="flex space-x-2">
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {players.length} Players
              </Badge>
              <Badge variant="outline">Attempts: {joinAttempts}</Badge>
              {isJoining && <Badge variant="secondary">Joining...</Badge>}
            </div>
          </div>

          {/* Header */}
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

          {/* Error Display */}
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

          {/* Loading State */}
          {isJoining && (
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Joining room...</p>
              </CardContent>
            </Card>
          )}

          {/* Waiting for Players */}
          {!isJoining && players.length === 0 && isConnected && !roomError && (
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">Waiting to join room...</p>
                <Button onClick={retryJoin} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Try Join Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Player List */}
          {players.length > 0 && (
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
          )}

          {/* Host Controls */}
          {currentPlayer?.isHost && players.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Button
                  onClick={startGame}
                  disabled={players.length < 2}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Game ({players.length} players)
                </Button>
                {players.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">Need at least 2 players to start</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Non-host waiting */}
          {!currentPlayer?.isHost && players.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Waiting for {hostPlayer?.name} to start the game...</p>
                <p className="text-sm text-muted-foreground mt-2">{players.length}/2+ players ready</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
