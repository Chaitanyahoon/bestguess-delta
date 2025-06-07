"use client"

import { ConnectionTest } from "@/components/connection-test"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <ConnectionTest />
    </div>
  )
}
