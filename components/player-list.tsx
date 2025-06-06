"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, Crown } from "lucide-react"

interface Player {
  id: string
  name: string
  score: number
  isHost?: boolean
  correctAnswers?: number
}

interface PlayerListProps {
  players: Player[]
  currentPlayerName?: string
  showScores?: boolean
  title?: string
}

export function PlayerList({ players, currentPlayerName, showScores = true, title = "Players" }: PlayerListProps) {
  const sortedPlayers = showScores ? [...players].sort((a, b) => b.score - a.score) : players

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          {title} ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  player.name === currentPlayerName ? "bg-primary/10 border border-primary/20" : "bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {showScores && index < 3 && (
                    <div className="flex items-center">
                      {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                      {index === 1 && <div className="w-4 h-4 rounded-full bg-gray-400" />}
                      {index === 2 && <div className="w-4 h-4 rounded-full bg-amber-600" />}
                    </div>
                  )}

                  {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{player.name}</span>
                      {player.name === currentPlayerName && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    {showScores && player.correctAnswers !== undefined && (
                      <p className="text-xs text-muted-foreground">{player.correctAnswers} correct answers</p>
                    )}
                  </div>
                </div>

                {showScores && (
                  <Badge variant="outline" className="font-bold">
                    {player.score} pts
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">No players yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
