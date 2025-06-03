"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2, XCircle } from "lucide-react"

export function ServerSideTest() {
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")
  const [socketId, setSocketId] = useState("")

  const testServerSideConnection = async () => {
    setStatus("loading")
    setMessage("Testing connection from server-side...")

    try {
      const response = await fetch("/api/socket-test")

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setSocketId(data.socketId || "")
        setMessage(`✅ Server-side connection successful!\n\nTransport: ${data.transport}\nMessage: ${data.message}`)
      } else {
        setStatus("error")
        setMessage(`❌ Server-side connection failed: ${data.message}`)
      }
    } catch (error) {
      console.error("Server-side test error:", error)
      setStatus("error")
      setMessage(`❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Server-Side Connection Test</span>
          {status === "success" && <Badge className="bg-green-500">Connected</Badge>}
          {status === "error" && <Badge variant="destructive">Failed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          This test connects to the backend from the server-side, bypassing browser CORS restrictions.
        </div>

        <div className="flex justify-center">
          <Button onClick={testServerSideConnection} disabled={status === "loading"} className="w-full">
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Server-Side Test"
            )}
          </Button>
        </div>

        {message && (
          <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
            {status === "success" ? (
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1" />
                <div>{message}</div>
              </div>
            ) : status === "error" ? (
              <div className="flex items-start">
                <XCircle className="w-4 h-4 text-red-500 mr-2 mt-1" />
                <div>{message}</div>
              </div>
            ) : (
              message
            )}
          </div>
        )}

        {socketId && (
          <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">Socket ID:</span>
            </div>
            <code className="text-xs bg-green-100 p-1 rounded">{socketId}</code>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
