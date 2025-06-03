"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"

interface GameTimerProps {
  timeLeft: number
  totalTime: number
  onTimeUp?: () => void
}

export function GameTimer({ timeLeft, totalTime, onTimeUp }: GameTimerProps) {
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    setIsWarning(timeLeft <= 10)

    if (timeLeft === 0) {
      onTimeUp?.()
    }
  }, [timeLeft, onTimeUp])

  const progressValue = (timeLeft / totalTime) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className={`w-4 h-4 ${isWarning ? "text-red-500" : "text-muted-foreground"}`} />
          <span className="text-sm text-muted-foreground">Time Remaining</span>
        </div>
        <span className={`font-bold text-lg ${isWarning ? "text-red-500 animate-pulse" : ""}`}>{timeLeft}s</span>
      </div>

      <Progress value={progressValue} className={`h-3 ${isWarning ? "animate-pulse" : ""}`} />

      {isWarning && (
        <p className="text-center text-sm text-red-500 font-medium animate-pulse">Hurry up! Time is running out!</p>
      )}
    </div>
  )
}
