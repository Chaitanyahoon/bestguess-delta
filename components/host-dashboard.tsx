"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Play, RefreshCw, Music, Users, Clock } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface HostDashboardProps {
  roomId: string
  playerCount: number
  onStartGame: () => void
}

export function HostDashboard({ roomId, playerCount, onStartGame }: HostDashboardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [roundTime, setRoundTime] = useState(30)
  const [totalRounds, setTotalRounds] = useState(5)
  const { isConnected } = useSocket()

  const handleStartGame = () => {
    // Apply any custom settings here before starting
    onStartGame()
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Host Controls</span>
          <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="h-8 w-8 p-0">
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isSettingsOpen ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Round Time (seconds)</label>
                <div className="flex items-center mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoundTime(Math.max(10, roundTime - 5))}
                    disabled={roundTime <= 10}
                  >
                    -
                  </Button>
                  <span className="mx-3 font-bold">{roundTime}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoundTime(Math.min(60, roundTime + 5))}
                    disabled={roundTime >= 60}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Total Rounds</label>
                <div className="flex items-center mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTotalRounds(Math.max(3, totalRounds - 1))}
                    disabled={totalRounds <= 3}
                  >
                    -
                  </Button>
                  <span className="mx-3 font-bold">{totalRounds}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTotalRounds(Math.min(10, totalRounds + 1))}
                    disabled={totalRounds >= 10}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={() => setIsSettingsOpen(false)}>
                Apply Settings
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-muted p-3 rounded-lg text-center">
                <Users className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Players</p>
                <p className="font-bold">{playerCount}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <Clock className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Round Time</p>
                <p className="font-bold">{roundTime}s</p>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <Music className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Rounds</p>
                <p className="font-bold">{totalRounds}</p>
              </div>
            </div>

            <Button
              onClick={handleStartGame}
              disabled={playerCount < 2 || !isConnected}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>

            {playerCount < 2 && (
              <p className="text-sm text-muted-foreground text-center mt-2">Need at least 2 players to start</p>
            )}

            {!isConnected && (
              <div className="flex items-center justify-center mt-2 space-x-2">
                <Badge variant="destructive">Disconnected</Badge>
                <Button size="sm" variant="outline" className="h-7 px-2">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reconnect
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
