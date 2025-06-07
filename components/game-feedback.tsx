"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface GameFeedbackProps {
  isCorrect?: boolean
  message?: string
  points?: number
  timeLeft?: number
  totalTime?: number
  showFeedback: boolean
}

export function GameFeedback({
  isCorrect,
  message,
  points,
  timeLeft,
  totalTime = 30,
  showFeedback,
}: GameFeedbackProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (showFeedback) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [showFeedback])

  if (!visible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <Card
        className={`transform transition-all duration-300 ${
          isCorrect ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"
        } shadow-lg animate-bounce-once w-64`}
      >
        <CardContent className="p-4 text-center">
          <div className="flex justify-center mb-2">
            {isCorrect ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <XCircle className="w-12 h-12 text-red-500" />
            )}
          </div>

          <h3 className={`text-lg font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
            {isCorrect ? "Correct!" : "Wrong!"}
          </h3>

          {message && <p className="text-sm mt-1">{message}</p>}

          {points !== undefined && (
            <p className={`font-bold text-lg mt-2 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {isCorrect ? `+${points}` : "0"} points
            </p>
          )}

          {timeLeft !== undefined && totalTime && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Response Time
                </span>
                <span>{totalTime - timeLeft}s</span>
              </div>
              <Progress value={(timeLeft / totalTime) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
