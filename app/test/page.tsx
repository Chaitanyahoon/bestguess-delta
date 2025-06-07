"use client"

import { useState } from "react"
import { ConnectionTest } from "@/components/connection-test"
import { DeploymentStatus } from "@/components/deployment-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TestPage() {
  const [activeTest, setActiveTest] = useState<"connection" | "deployment">("deployment")

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Button
                variant={activeTest === "deployment" ? "default" : "outline"}
                onClick={() => setActiveTest("deployment")}
                className="flex-1"
              >
                Deployment
              </Button>
              <Button
                variant={activeTest === "connection" ? "default" : "outline"}
                onClick={() => setActiveTest("connection")}
                className="flex-1"
              >
                Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeTest === "deployment" ? <DeploymentStatus /> : <ConnectionTest />}
      </div>
    </div>
  )
}
