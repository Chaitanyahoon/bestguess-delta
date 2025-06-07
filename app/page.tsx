"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Users, Trophy, Play, Plus, ArrowRight, Sparkles, Settings } from "lucide-react"
import { ConnectionStatus } from "@/components/connection-status"

export default function HomePage() {
  const [roomCode, setRoomCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const joinGame = () => {
    if (!roomCode.trim() || !playerName.trim()) {
      alert("Please enter both room code and your name")
      return
    }

    if (roomCode.trim().length !== 6) {
      alert("Room code must be exactly 6 characters")
      return
    }

    if (playerName.trim().length > 20) {
      alert("Player name must be 20 characters or less")
      return
    }

    const cleanRoomCode = roomCode.trim().toUpperCase()
    const cleanPlayerName = playerName.trim()

    console.log(`Joining room: ${cleanRoomCode} as ${cleanPlayerName}`)
    router.push(`/room/${cleanRoomCode}?name=${encodeURIComponent(cleanPlayerName)}`)
  }

  const createGame = () => {
    if (!playerName.trim()) {
      alert("Please enter your name")
      return
    }

    if (playerName.trim().length > 20) {
      alert("Player name must be 20 characters or less")
      return
    }

    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const cleanPlayerName = playerName.trim()

    console.log(`Creating room: ${newRoomCode} as ${cleanPlayerName}`)
    router.push(`/room/${newRoomCode}?name=${encodeURIComponent(cleanPlayerName)}&host=true`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <ConnectionStatus />

      {/* Debug Button */}
      <Button
        onClick={() => router.push("/test")}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Settings className="w-4 h-4 mr-1" />
        Test Connection
      </Button>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative animate-spin-slow">
              <Music className="w-16 h-16 text-white mr-4" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              BeatMatch
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/80 font-light">
            Guess the beat, match the rhythm, win the game! 🎵
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {/* Player Name Input */}
            <div className="animate-slide-up">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Users className="w-5 h-5 text-white mr-2" />
                    <h3 className="text-white font-semibold">Enter Your Name</h3>
                  </div>
                  <Input
                    placeholder="Your awesome name..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-center text-lg h-12 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === "Enter" && playerName.trim() && createGame()}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 animate-slide-up-delay">
              {/* Create Game Button */}
              <Button
                onClick={createGame}
                disabled={!playerName.trim()}
                className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-2xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create New Game
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>

              {/* Join Game Section */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-gradient-to-r from-purple-900 to-blue-900 px-4 text-white/60 font-medium">
                    Or Join Existing
                  </span>
                </div>
              </div>

              {!isJoining ? (
                <Button
                  onClick={() => setIsJoining(true)}
                  variant="outline"
                  className="w-full h-16 border-white/30 text-white hover:bg-white/10 font-bold text-lg backdrop-blur-sm"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Join Game
                </Button>
              ) : (
                <div className="space-y-3 animate-slide-down">
                  <Input
                    placeholder="Enter room code..."
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-center text-lg h-12 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === "Enter" && roomCode.trim() && playerName.trim() && joinGame()}
                  />
                  <div className="flex space-x-3">
                    <Button
                      onClick={joinGame}
                      disabled={!roomCode.trim() || !playerName.trim()}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
                    >
                      Join Now
                    </Button>
                    <Button
                      onClick={() => setIsJoining(false)}
                      variant="outline"
                      className="h-12 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="animate-fade-in-delay">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-2">
                      <Music className="w-8 h-8 mx-auto text-purple-300" />
                      <p className="text-white/80 text-sm font-medium">Real Music</p>
                    </div>
                    <div className="space-y-2">
                      <Users className="w-8 h-8 mx-auto text-blue-300" />
                      <p className="text-white/80 text-sm font-medium">Multiplayer</p>
                    </div>
                    <div className="space-y-2">
                      <Trophy className="w-8 h-8 mx-auto text-yellow-300" />
                      <p className="text-white/80 text-sm font-medium">Compete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/50 text-sm animate-fade-in-delay">
          <p>🎵 Powered by Spotify API • Built for music lovers</p>
          <p className="mt-2 text-xs">Backend: beatmatch-jbss.onrender.com</p>
        </div>
      </div>
    </div>
  )
}
