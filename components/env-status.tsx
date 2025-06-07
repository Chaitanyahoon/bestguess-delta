"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function EnvStatus() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  const frontendUrl = typeof window !== "undefined" ? window.location.origin : ""

  const getStatus = (value: string | undefined, name: string) => {
    if (!value) {
      return {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        badge: <Badge variant="destructive">Missing</Badge>,
        message: `${name} is not set`,
      }
    }

    if (value.includes("localhost") || value.includes("127.0.0.1")) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
        badge: <Badge variant="secondary">Local</Badge>,
        message: `${name} is set to localhost`,
      }
    }

    return {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      badge: <Badge className="bg-green-500">OK</Badge>,
      message: `${name} is properly configured`,
    }
  }

  const socketStatus = getStatus(socketUrl, "Backend URL")

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Environment Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {socketStatus.icon}
              <span className="font-medium">Backend URL</span>
            </div>
            {socketStatus.badge}
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {socketUrl || "Not set - using fallback: https://beatmatch-jbss.onrender.com"}
          </p>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium">Frontend URL</span>
            </div>
            <Badge className="bg-green-500">OK</Badge>
          </div>
          <p className="text-xs text-muted-foreground ml-6">{frontendUrl}</p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Setup Instructions</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>1. Deploy your backend to Render</p>
            <p>2. Set NEXT_PUBLIC_SOCKET_URL to your backend URL</p>
            <p>3. Redeploy your frontend</p>
          </div>
        </div>

        {!socketUrl && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> NEXT_PUBLIC_SOCKET_URL is not set. Using fallback URL. Set this environment
              variable for production.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
