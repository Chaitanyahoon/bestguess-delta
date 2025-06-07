"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Clock, Users, Trophy } from "lucide-react"

interface GameStatusProps {
  currentRound: number
  totalRounds: number
  playerCount: number
  timeLeft?: number
  isActive: boolean
}

export function GameStatus({ currentRound, totalRounds, playerCount, timeLeft, isActive }: GameStatusProps) {
  return (
    <Card className="mb-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-white/10">
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center p-2">
            <Music className="w-5 h-5 text-purple-300 mb-1" />
            <p className="text-xs text-white/70">Round</p>
            <p className="font-bold text-white">
              {currentRound}/{totalRounds}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <Users className="w-5 h-5 text-blue-300 mb-1" />
            <p className="text-xs text-white/70">Players</p>
            <p className="font-bold text-white">{playerCount}</p>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <Clock className="w-5 h-5 text-green-300 mb-1" />
            <p className="text-xs text-white/70">Time</p>
            <p className="font-bold text-white">{timeLeft || "-"}</p>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <Trophy className="w-5 h-5 text-yellow-300 mb-1" />
            <p className="text-xs text-white/70">Status</p>
            <Badge variant={isActive ? "default" : "secondary"} className="mt-1">
              {isActive ? "Active" : "Waiting"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
