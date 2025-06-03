"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Home, RotateCcw } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface Player {
  id: string
  name: string
  score: number
  correctAnswers: number
}

export default function Leaderboard() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const playerName = searchParams.get("name") || ""

  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.emit("get-final-scores", roomId)

    socket.on("final-scores", (data) => {
      setPlayers(data.players.sort((a: Player, b: Player) => b.score - a.score))
      setLoading(false)
    })

    return () => {
      socket.off("final-scores")
    }
  }, [socket, roomId])

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">
            #{position + 1}
          </span>
        )
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 2:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
      default:
        return "bg-muted"
    }
  }

  const currentPlayerPosition = players.findIndex((p) => p.name === playerName)
  const winner = players[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Calculating final scores...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
            {winner && (
              <p className="text-xl text-white/90">
                🎉 {winner.name} wins with {winner.score} points!
              </p>
            )}
          </div>

          {/* Winner Spotlight */}
          {winner && (
            <Card className="mb-6 border-yellow-400 border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold mb-2">{winner.name}</h2>
                  <div className="flex items-center justify-center space-x-4">
                    <Badge className="bg-yellow-500 text-black text-lg px-3 py-1">{winner.score} points</Badge>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {winner.correctAnswers}/5 correct
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Leaderboard */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Final Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${getPositionColor(index)} ${
                      player.name === playerName ? "ring-2 ring-blue-400" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {getPositionIcon(index)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg">{player.name}</span>
                          {player.name === playerName && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm opacity-75">{player.correctAnswers}/5 correct answers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl">{player.score}</div>
                      <div className="text-sm opacity-75">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Your Performance */}
          {currentPlayerPosition >= 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">#{currentPlayerPosition + 1}</div>
                    <div className="text-sm text-muted-foreground">Position</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{players[currentPlayerPosition].score}</div>
                    <div className="text-sm text-muted-foreground">Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((players[currentPlayerPosition].correctAnswers / 5) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Home className="w-4 h-4 mr-2" />
              New Game
            </Button>
            <Button
              onClick={() => router.push(`/room/${roomId}?name=${encodeURIComponent(playerName)}&host=true`)}
              className="bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
