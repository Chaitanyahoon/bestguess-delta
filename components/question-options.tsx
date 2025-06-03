"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

interface QuestionOptionsProps {
  options: string[]
  selectedAnswer: number | null
  correctAnswer?: number | null
  onSelectAnswer: (index: number) => void
  onSubmitAnswer: () => void
  showResults?: boolean
  disabled?: boolean
}

export function QuestionOptions({
  options,
  selectedAnswer,
  correctAnswer,
  onSelectAnswer,
  onSubmitAnswer,
  showResults = false,
  disabled = false,
}: QuestionOptionsProps) {
  const getButtonVariant = (index: number) => {
    if (!showResults) {
      return selectedAnswer === index ? "default" : "outline"
    }

    if (correctAnswer === index) {
      return "default" // Correct answer
    }

    if (selectedAnswer === index && correctAnswer !== index) {
      return "destructive" // Wrong selected answer
    }

    return "outline"
  }

  const getButtonClassName = (index: number) => {
    let baseClass = "p-4 h-auto text-left justify-start transition-all duration-300"

    if (showResults) {
      if (correctAnswer === index) {
        baseClass += " bg-green-600 hover:bg-green-700 text-white border-green-600"
      } else if (selectedAnswer === index && correctAnswer !== index) {
        baseClass += " bg-red-600 hover:bg-red-700 text-white border-red-600"
      }
    }

    return baseClass
  }

  const getIcon = (index: number) => {
    if (!showResults) return null

    if (correctAnswer === index) {
      return <CheckCircle className="w-5 h-5 text-white ml-2" />
    }

    if (selectedAnswer === index && correctAnswer !== index) {
      return <XCircle className="w-5 h-5 text-white ml-2" />
    }

    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What song is this?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3">
          {options.map((option, index) => (
            <Button
              key={index}
              variant={getButtonVariant(index)}
              className={getButtonClassName(index)}
              onClick={() => !showResults && !disabled && onSelectAnswer(index)}
              disabled={showResults || disabled}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span className="font-bold mr-3 text-lg">{String.fromCharCode(65 + index)}.</span>
                  <span className="text-left">{option}</span>
                </div>
                {getIcon(index)}
              </div>
            </Button>
          ))}
        </div>

        {!showResults && !disabled && (
          <Button onClick={onSubmitAnswer} disabled={selectedAnswer === null} className="w-full mt-4" size="lg">
            Submit Answer
          </Button>
        )}

        {disabled && !showResults && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">Waiting for other players...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
