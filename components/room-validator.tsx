"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RoomValidatorProps {
  roomId: string
  playerName: string
  isHost: boolean
  children: React.ReactNode
}

export function RoomValidator({ roomId, playerName, isHost, children }: RoomValidatorProps) {
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const validateRoom = async () => {
      try {
        // Validate room ID format
        if (!roomId || roomId.length !== 6) {
          throw new Error("Invalid room code format")
        }

        // Validate player name
        if (!playerName || playerName.trim().length === 0) {
          throw new Error("Player name is required")
        }

        if (playerName.trim().length > 20) {
          throw new Error("Player name too long (max 20 characters)")
        }

        // If creating a new room (host), no need to check if room exists
        if (isHost) {
          setIsValidating(false)
          return
        }

        // For joining existing rooms, we'll let the socket handle validation
        setIsValidating(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Validation failed")
        setIsValidating(false)
      }
    }

    validateRoom()
  }, [roomId, playerName, isHost])

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Validating room...</p>
            <p className="text-sm text-muted-foreground mt-2">
              {isHost ? "Creating room" : "Checking room availability"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Room Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
