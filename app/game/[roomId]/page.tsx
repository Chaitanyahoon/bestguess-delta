"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { GameAudioPlayer } from "@/components/game-audio-player"
import { GameTimer } from "@/components/game-timer"
import { QuestionOptions } from "@/components/question-options"
import { PlayerList } from "@/components/player-list"

interface Question {
  id: string
  audioUrl: string
  options: string[]
  correctAnswer: number
  artist: string
}

interface Player {
  id: string
  name: string
  score: number
  correctAnswers: number
}

export default function GameScreen() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const playerName = searchParams.get("name") || ""

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [roundNumber, setRoundNumber] = useState(1)
  const [totalRounds] = useState(5)
  const [players, setPlayers] = useState<Player[]>([])
  const [showResults, setShowResults] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)

  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on("new-question", (data) => {
      setCurrentQuestion(data.question)
      setSelectedAnswer(null)
      setTimeLeft(30)
      setShowResults(false)
      setCorrectAnswer(null)
      setRoundNumber(data.round)
      setAnswerSubmitted(false)
    })

    socket.on("round-results", (data) => {
      setCorrectAnswer(data.correctAnswer)
      setPlayers(data.players)
      setShowResults(true)
    })

    socket.on("game-ended", () => {
      router.push(`/leaderboard/${roomId}?name=${encodeURIComponent(playerName)}`)
    })

    socket.on("timer-update", (time) => {
      setTimeLeft(time)
    })

    return () => {
      socket.off("new-question")
      socket.off("round-results")
      socket.off("game-ended")
      socket.off("timer-update")
    }
  }, [socket, roomId, playerName, router])

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (socket && selectedAnswer !== null && !answerSubmitted) {
      socket.emit("submit-answer", {
        roomId,
        playerName,
        answer: selectedAnswer,
      })
      setAnswerSubmitted(true)
    }
  }

  const handleTimeUp = () => {
    if (!answerSubmitted && selectedAnswer !== null) {
      handleSubmitAnswer()
    }
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading next question...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Round {roundNumber}/{totalRounds}
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Users className="w-4 h-4 mr-1" />
                {players.length} Players
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timer */}
              <GameTimer timeLeft={timeLeft} totalTime={30} onTimeUp={handleTimeUp} />

              {/* Audio Player */}
              <GameAudioPlayer audioUrl={currentQuestion.audioUrl} autoPlay={true} />

              {/* Question Options */}
              <QuestionOptions
                options={currentQuestion.options}
                selectedAnswer={selectedAnswer}
                correctAnswer={correctAnswer}
                onSelectAnswer={handleSelectAnswer}
                onSubmitAnswer={handleSubmitAnswer}
                showResults={showResults}
                disabled={answerSubmitted && !showResults}
              />

              {/* Results */}
              {showResults && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Round {roundNumber} Results</h3>
                  <p className="text-lg mb-1">
                    Correct Answer: <span className="font-bold">{currentQuestion.options[correctAnswer!]}</span>
                  </p>
                  <p className="text-sm opacity-75">by {currentQuestion.artist}</p>
                  {roundNumber < totalRounds && <p className="mt-4 text-sm">Next round starting soon...</p>}
                  {roundNumber === totalRounds && <p className="mt-4 text-sm">Calculating final scores...</p>}
                </div>
              )}
            </div>

            {/* Sidebar - Player List */}
            <div className="lg:col-span-1">
              <PlayerList players={players} currentPlayerName={playerName} showScores={true} title="Live Scores" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
